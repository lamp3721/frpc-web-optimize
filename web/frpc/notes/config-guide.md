# frp 配置指南：如何从源码确定配置项

本文档面向 AI / 开发者，解释如何从 frp Go 源码中准确提取配置字段、默认值、TOML 键名、以及判断字段在特定模式下是否生效。

---

## 1. 找到配置结构体

所有 frpc 客户端配置定义在：

```
pkg/config/v1/client.go      # ClientCommonConfig、ClientTransportConfig、TLSClientConfig、AuthClientConfig
pkg/config/v1/common.go       # WebServerConfig、QUICOptions、LogConfig、TLSConfig
pkg/config/v1/proxy.go        # ProxyBaseConfig、ProxyTransport、各类型代理配置
pkg/config/v1/visitor.go      # VisitorBaseConfig、各类型访问者配置
```

每个结构体对应 TOML 中的一个区块。例如 `ClientCommonConfig` 对应根级和 `[common]` 区块。

## 2. 确定 TOML 键名

**规则：看 `json` tag，不是 `toml` tag。**

frp 不使用原生 `toml` struct tag。实际流程是：

```
TOML → go-toml 解析为 map → jsonx.Marshal → JSON → json.Unmarshal → Go struct
```

所以 TOML 键名 = `json` tag 的值（去掉 `,omitempty` 后缀）。

**示例：**

```go
type ClientCommonConfig struct {
    ServerAddr string `json:"serverAddr,omitempty"`
    ServerPort int    `json:"serverPort,omitempty"`
}
```

→ TOML 键名为 `serverAddr`、`serverPort`

**嵌套规则：** 子结构体的 `json` tag 决定嵌套层级。

```go
type ClientCommonConfig struct {
    Transport ClientTransportConfig `json:"transport,omitempty"`
}
```

→ `[transport]` 区块，内部字段如 `transport.tcpMux` = `transport.tcpMux`

**点键格式有效：** `transport.tls.enable = true` 等同于 `[transport.tls] enable = true`

## 3. 确定默认值

每类配置都有一个 `Complete()` 方法。

**`util.EmptyOr` 语义：**

```go
func EmptyOr[T comparable](v T, fallback T) T {
    var zero T
    if zero == v { return fallback }
    return v
}
```

- `string` 类型：`""` → 使用默认值
- `int` 类型：`0` → 使用默认值  
- `*bool` 指针类型：`nil` → 使用默认值

**Complete() 调用链：**

```
ClientCommonConfig.Complete()          // client.go:85
  ├── AuthClientConfig.Complete()      // client.go:206
  │     └── method = "token"
  ├── LogConfig.Complete()             // common.go:119
  │     └── to="console", level="info", maxDays=3
  ├── ClientTransportConfig.Complete() // client.go:147
  │     ├── protocol="tcp", tcpMux=true, poolCount=1, ...
  │     ├── if tcpMux: heartbeat=-1/-1
  │     ├── else:      heartbeat=30/90
  │     ├── QUICOptions.Complete()     // common.go:44
  │     └── TLSClientConfig.Complete() // client.go:182
  └── WebServerConfig.Complete()       // common.go:71
        └── addr="127.0.0.1"（仅此字段有默认，port/user/password 无默认）
```

**查找方法：** 在 `client.go` 和 `common.go` 中搜索 `func (c *XXX) Complete()`

**条件默认示例 — `ClientTransportConfig.Complete()`：**

```go
// pkg/config/v1/client.go:156-163
if lo.FromPtr(c.TCPMux) {
    c.HeartbeatInterval = util.EmptyOr(c.HeartbeatInterval, -1)    // 禁用
    c.HeartbeatTimeout = util.EmptyOr(c.HeartbeatTimeout, -1)
} else {
    c.HeartbeatInterval = util.EmptyOr(c.HeartbeatInterval, 30)    // 仅控制连接
    c.HeartbeatTimeout = util.EmptyOr(c.HeartbeatTimeout, 90)
}
```

## 4. 判断字段是否 → 必配 / 可选

| 条件 | 结论 |
|------|------|
| `Complete()` 中调用了 `util.EmptyOr(field, default)` | **可选**，有默认值 |
| `Complete()` 中**没有**设置此字段 | **必配**，无默认值（Go 会使用零值 `""` 或 `0`，通常导致不启动或行为异常） |

**但同时区分两种"必配"：**

| 类型 | 含义 | 示例 |
|------|------|------|
| Go-required | Complete() 无默认 | `auth.token` — Go 零值为 `""`，连接会被 frps 拒绝 |
| Mode-required | 有默认但模式下必须覆盖 | `transport.tcpMux = false` — Go 默认 `true`，但 TCP 直连模式必须写 `false` |

## 5. 判断字段在特定模式下是否生效

只看 `Complete()` 不够。需检查**连接建立代码**确认该字段实际被读取。

**关键文件：**

```
client/connector.go        # 各种传输协议的连接建立
client/control_session.go  # 控制会话初始化（登录消息、消息读写器）
client/control.go          # 控制连接管理（心跳、连接池）
client/proxy/proxy.go      # 代理工作连接处理
```

**判断方法：**

1. 确定该模式使用的连接路径：
   - TCP（多路复用 + TCP 直连）→ `client/connector.go` `realConnect()`
   - QUIC → `client/connector.go` `Open()` (QUIC 分支)
2. 在对应连接函数中搜索字段的 Go 变量名
3. 找到即说明该模式下**生效**；找不到则说明该模式下**不生效**

**示例 — `transport.wireProtocol` 在所有模式都生效：**

```
client/control_session.go:98-100 → 读 WireProtocol 构造消息读写器
client/connector.go:68             → 写 v2 魔术字节
```
无论 TCP、TCP+多路复用、还是 QUIC，`control_session.go` 都会读取此字段。

**示例 — `transport.dialServerKeepalive` 只在 TCP 模式生效：**

```
client/connector.go → realConnect() → 读 DialServerKeepAlive
client/connector.go → Open() (QUIC) → 不读（UDP 无 TCP keepalive）
```

**示例 — `transport.heartbeatInterval` 条件生效：**

- tcpMux=true → Complete() 设为 -1，`control.go` heartbeatWorker 无效
- tcpMux=false → Complete() 设为 30，`control.go` heartbeatWorker 每 30s 发 Ping

**示例 — `transport.tls.disableCustomTLSFirstByte` 只在 TCP 生效：**

```
client/connector.go:220 → realConnect() → DialHookCustomTLSHeadByte
client/connector.go:100-138 → Open() (QUIC) → 不读此字段
```

## 6. 字段是否可省略（omitempty）

tag 中有 `omitempty` 的字段在值为零值时会被省略（不写入 TOML）。此时 Go 使用 `Complete()` 中的默认值。

## 7. 生成 TOML 输出

**规则：只写非默认值的字段。**

| 字段类型 | 写入条件 |
|---------|---------|
| 必配字段（无默认值） | 始终写出，为空时提示用户填写 |
| 有默认值的可选字段 | 只在用户显式修改时写出 |
| 条件生效的字段 | 只在对应的模式/条件下显示和写出 |

## 8. 审计清单

1. **打开 `pkg/config/v1/client.go`**，找到对应结构体
2. **看 `json` tag**，确定 TOML 键名和嵌套关系
3. **看 `Complete()` 方法**，提取所有默认值
4. **分必配/可选**：无 `EmptyOr` fallback = 必配
5. **区分两种"必配"**：Go-required vs Mode-required
6. **检查条件逻辑**：如 `tcpMux` → `heartbeat`
7. **追踪连接代码**：确定字段在特定模式下是否被读取
8. **看 `*bool` 指针**：`lo.ToPtr(true)` = 默认 true
9. **检查 `omitempty`**：确定零值是否输出
10. **交叉验证**：搜 `pkg/config/validation/` 检查校验规则

## 9. 关键文件索引

| 文件 | 内容 |
|------|------|
| `pkg/config/v1/client.go` | 客户端配置（连接、传输、TLS、认证）、Complete() 方法 |
| `pkg/config/v1/common.go` | 共用配置（WebServer、QUIC、Log、TLS 基础） |
| `pkg/config/v1/proxy.go` | 代理配置（基础字段 + 各类型特有字段） |
| `pkg/config/v1/visitor.go` | 访问者配置 |
| `pkg/config/v1/validation/` | 字段校验规则 |
| `pkg/config/load.go` | TOML → 结构体的加载流程 |
| `pkg/util/util/types.go` | `EmptyOr` 定义 |
| **生效验证** | |
| `client/connector.go` | 各种协议的连接建立（TCP/QUIC）|
| `client/control_session.go` | 控制会话初始化 |
| `client/control.go` | 心跳、连接池管理 |
| `client/proxy/proxy.go` | 代理工作连接（加密/压缩/限速）|

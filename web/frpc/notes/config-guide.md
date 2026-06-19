# frp 配置指南：如何从源码确定配置项

本文档面向 AI / 开发者，解释如何从 frp Go 源码中准确提取配置字段、默认值、TOML 键名。

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

**嵌套规则：**

```go
type ClientCommonConfig struct {
    Auth      AuthClientConfig      `json:"auth,omitempty"`
    Transport ClientTransportConfig `json:"transport,omitempty"`
}
```

→ 子结构体形成嵌套区块：

```toml
[auth]
method = "token"
token = "xxx"

[transport]
tcpMux = true
```

**点键（dotted key）也有效：**

```toml
transport.tls.enable = true
# 等同于
[transport.tls]
enable = true
```

## 3. 确定默认值

每类配置都有一个 `Complete()` 方法，通过 `util.EmptyOr(val, default)` 设置默认值。

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

**查找方法：** 在 `client.go` 和 `common.go` 中搜索 `func (c *XXX) Complete()`

**示例 — `ClientTransportConfig.Complete()`：**

```go
// pkg/config/v1/client.go:147-165
func (c *ClientTransportConfig) Complete() {
    c.Protocol = util.EmptyOr(c.Protocol, "tcp")              // 默认 "tcp"
    c.DialServerTimeout = util.EmptyOr(c.DialServerTimeout, 10) // 默认 10s
    c.PoolCount = util.EmptyOr(c.PoolCount, 1)                  // 默认 1
    c.TCPMux = util.EmptyOr(c.TCPMux, lo.ToPtr(true))          // 默认 true（指针）

    // 条件默认：
    if lo.FromPtr(c.TCPMux) {
        c.HeartbeatInterval = -1   // tcpMux=true → 禁用心跳
        c.HeartbeatTimeout = -1
    } else {
        c.HeartbeatInterval = 30   // tcpMux=false → 心跳 30s
        c.HeartbeatTimeout = 90
    }
}
```

**结论表：**

| 字段 | 默认值 | 来源 |
|------|--------|------|
| `transport.protocol` | `"tcp"` | `Complete()` line 148 |
| `transport.tcpMux` | `true` | `Complete()` line 154 |
| `transport.poolCount` | `1` | `Complete()` line 153 |
| `transport.heartbeatInterval` | `30` (tcpMux=false) / `-1` (tcpMux=true) | `Complete()` line 156-163 |
| `log.to` | `"console"` | `common.go` `LogConfig.Complete()` |

## 4. 字段是否可省略（omitempty）

tag 中有 `omitempty` 的字段在值为零值时会被省略（不写入 TOML）。

```go
ServerPort int `json:"serverPort,omitempty"`
```
- 如果值为 `0` 且带 `omitempty`，则该键不输出到 TOML
- 此时 Go 会使用 `Complete()` 中的默认值

**注意：** 如果字段没有 `omitempty`，零值也会写入 TOML，这可能导致意外行为。

## 5. 生成 TOML 输出

**规则：只写非默认值的字段。**

| 字段类型 | 写入条件 |
|---------|---------|
| 必配字段（无默认值） | 始终写出，为空时提示用户填写 |
| 有默认值的可选字段 | 只在用户显式修改时写出 |
| 条件生效的字段 | 只在对应的模式/条件下显示和写出 |

**示例 — 多路复用模式的标准 TOML 输出：**

```toml
serverAddr = "1.2.3.4"        # 必配，无默认值
# serverPort = 7000            # [可选] 默认 7000，不写出
auth.token = "xxx"             # 必配，无默认值
# 传输层全部用默认值，不写出任何 [transport] 区块
[[proxies]]
name = "ssh"
type = "tcp"
localPort = 22
remotePort = 6000
```

## 6. 审计清单

接到生成配置的任务时，按以下步骤操作：

1. **打开 `pkg/config/v1/client.go`**，找到对应结构体
2. **看 `json` tag**，确定 TOML 键名和嵌套关系
3. **看 `Complete()` 方法**，提取所有默认值
4. **分必配/可选**：无 `EmptyOr` fallback = 必配；有 fallback = 可选
5. **检查条件逻辑**：如 `tcpMux` 影响 `heartbeat` 默认值
6. **看 `*bool` 指针**：`lo.ToPtr(true)` = 默认 true，nil 时使用默认
7. **检查 `omitempty`**：确定零值是否输出
8. **交叉验证**：搜 `pkg/config/validation/` 检查是否有校验规则

## 7. 关键文件索引

| 文件 | 内容 |
|------|------|
| `pkg/config/v1/client.go` | 客户端配置（连接、传输、TLS、认证） |
| `pkg/config/v1/common.go` | 共用配置（WebServer、QUIC、Log、TLS 基础） |
| `pkg/config/v1/proxy.go` | 代理配置（基础字段 + 各类型特有字段） |
| `pkg/config/v1/visitor.go` | 访问者配置 |
| `pkg/config/v1/validation/` | 字段校验规则 |
| `pkg/config/flags.go` | 命令行 flag 默认值 |
| `pkg/config/load.go` | TOML → 结构体的加载流程 |
| `pkg/util/util/types.go` | `EmptyOr` 定义 |

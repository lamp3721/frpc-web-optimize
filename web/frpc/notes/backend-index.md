# frp 后端代码索引：配置项生效位置

本文档帮助 AI / 开发者从配置项反向定位到 Go 源码中实际生效的代码。

## 查找方法

1. 在 `pkg/config/v1/` 找到配置字段的 Go 变量名
2. 用 IDE 的"查找引用"搜该字段名
3. 定位到实际使用该字段的业务逻辑

## agent_runbooks 索引

### 客户端代理连接

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `transport.useEncryption` | `client/proxy/proxy.go:138` | `libio.WithEncryption()` 包装连接 |
| `transport.useCompression` | `client/proxy/proxy.go:147` | `libio.WithCompressionFromPool()` 包装连接 |
| `transport.bandwidthLimit` | `client/proxy/proxy.go:133-136` | 限速读写 |
| `localIP` / `localPort` | `client/proxy/proxy.go:47-53` | 拨号到本地服务 |
| `remotePort` | `client/proxy/proxy.go` | 发送给 frps 注册 |

### 客户端连接与重连

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `serverAddr` / `serverPort` | `client/service.go:145-155` | 连接 frps |
| `transport.protocol` | `client/service.go:120-130` | 选择 tcp/kcp/quic/websocket |
| `transport.tcpMux` | `client/service.go:372` | 设置 `connectServer()` 的 multiplexer |
| `transport.poolCount` | `client/control.go:116-119` | 预建工作连接数 |
| `transport.dialServerKeepalive` | `client/service.go:412` | TCP keepalive 设置 |
| 重连退避策略 | `client/service.go:273-285` | 前 3 次 200ms，之后指数退避 |

### 心跳

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `transport.heartbeatInterval` | `client/control.go:231-248` | `heartbeatWorker()` 发 Ping |
| `transport.heartbeatTimeout` | `client/control.go:231-248` | 收不到 Pong 判定断连 |

### 认证

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `auth.token` | `client/service.go:240-245` | 登录时传给 frps |
| `auth.method = "token"` | `client/service.go:237` | 决定认证方式 |
| `auth.oidc.*` | `client/service.go:270-295` | OIDC 认证流程 |

### 管理面板 (webServer)

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `webServer.addr` / `webServer.port` | `pkg/util/http/server.go:51-53` | 启动 HTTP 服务 |
| `webServer.user` / `webServer.password` | `pkg/util/net/http.go:45-60` | Basic Auth 中间件 |

### QUIC

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `transport.quic.keepalivePeriod` | `client/service.go:178` | quic-go Transport 配置 |
| `transport.quic.maxIdleTimeout` | `client/service.go:179` | quic-go Transport 配置 |

### TLS

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `transport.tls.enable` | `client/service.go:410-415` | 是否启用 TLS |
| `transport.tls.certFile` / `.keyFile` | `client/service.go:425-435` | mTLS 证书加载 |
| `transport.tls.serverName` | `client/service.go:420` | TLS SNI |
| `transport.tls.disableCustomTLSFirstByte` | `client/service.go:407` | 自定义首字节开关 |

### 日志

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `log.to` | `pkg/util/log/log.go:60-72` | 初始化 log 输出目标 |
| `log.level` | `pkg/util/log/log.go:52` | 设置日志级别 |
| `log.maxDays` | `pkg/util/log/log.go:85-90` | 日志轮转清理 |

### 代理配置详解

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `name` | 元数据传递 | 唯一标识 |
| `type` | `client/proxy/proxy.go:35-42` | 选择代理类型实现 |
| `enabled` | `client/proxy/proxy.go:110` | 跳过已禁用的代理 |
| `customDomains` | 发送给 frps | 域名路由匹配 |
| `subdomain` | 发送给 frps | 子域名路由匹配 |
| `locations` | HTTP 代理特有 | URL 路径匹配 |
| `httpUser` / `httpPassword` | HTTP 代理特有 | Basic Auth |

### 服务端相关 (frps)

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `bindPort` | `server/service.go:130` | TCP 监听端口 |
| `quicBindPort` | `server/service.go:140` | QUIC UDP 监听端口 |
| `transport.maxPoolCount` | `server/proxy/proxy.go:85-90` | 服务端连接池上限 |
| `userConnTimeout` | `server/proxy/proxy.go:151-155` | 空池等待超时 |

## 快速定位步骤

1. **确定搜索词** — 配置的 Go 变量名（如 `UseCompression`）
2. **在 `client/` 下搜索** — 客户端逻辑：`grep -r "UseCompression" client/`
3. **在 `server/` 下搜索** — 服务端逻辑：`grep -r "maxPoolCount" server/`
4. **在 `pkg/` 下搜索** — 工具/中间件：`grep -r "HTTPAuthMiddleware" pkg/`

# frp 后端代码索引：配置项生效位置

本文档帮助 AI / 开发者从配置项反向定位到 Go 源码中实际生效的代码。

## 查找方法

1. 在 `pkg/config/v1/` 找到配置字段的 Go 变量名
2. 用 IDE/grep 搜该变量名在 `client/` 和 `server/` 下的引用
3. 定位到实际使用该字段的业务逻辑

---

## 客户端代理连接

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `transport.useEncryption` | `client/proxy/proxy.go:138` | `libio.WithEncryption()` |
| `transport.useCompression` | `client/proxy/proxy.go:147` | `libio.WithCompressionFromPool()` |
| `transport.bandwidthLimit` | `client/proxy/proxy.go:133-136` | 限速读写 |
| `localIP` / `localPort` | `client/proxy/proxy.go:47-53` | 拨号到本地服务 |

## 客户端连接与重连

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `serverAddr` / `serverPort` | `client/service.go:145-155` | 连接 frps |
| `transport.protocol` | `client/service.go:120-130`、`client/connector.go:100-138` | 选择 TCP/QUIC 连接路径 |
| `transport.tcpMux` | `client/service.go:372`、`client/control.go` | 设置 muxer；同时影响 heartbeat 默认值 |
| `transport.poolCount` | `client/control.go:116-119` | 预建工作连接数 |
| `transport.dialServerKeepalive` | `client/service.go:412`、`client/connector.go` | TCP keepalive（仅 TCP 协议生效） |
| `transport.dialServerTimeout` | `client/connector.go` | 拨号超时 |
| `transport.wireProtocol` | `client/control_session.go:98-100`、`client/connector.go:68` | 内部协议版本（**所有模式都读取**） |
| 重连退避策略 | `client/service.go:273-285` | 前 3 次 200ms，之后指数退避（2x 因子，最大 20s） |

## 心跳

| 配置项 | 生效位置 | 条件 | 作用 |
|--------|---------|------|------|
| `transport.heartbeatInterval` | `client/control.go:231-248` | `tcpMux=false` 时才生效 | `heartbeatWorker()` 发 Ping（30s） |
| `transport.heartbeatTimeout` | `client/control.go:231-248` | `tcpMux=false` 时才生效 | 收不到 Pong 判定断连（90s） |
| `transport.tcpMuxKeepaliveInterval` | yamux 库内部 | `tcpMux=true` 时才生效 | yamux session ping（30s） |

> 当 `tcpMux=true` 时，`Complete()` 自动设 `heartbeatInterval/heartbeatTimeout = -1`（禁用）。

## 认证

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `auth.token` | `client/service.go:240-245` | 登录时传给 frps |
| `auth.method` | `client/service.go:237` | 决定认证方式（token/oidc） |
| `auth.oidc.*` | `client/service.go:270-295` | OIDC 认证流程 |

## 管理面板 (webServer)

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `webServer.addr` / `webServer.port` | `pkg/util/http/server.go:51-53` | 启动 HTTP 服务。port=0 时不启动 |
| `webServer.user` / `webServer.password` | `pkg/util/net/http.go:45-60` | Basic Auth 中间件 |

## TLS — TCP 模式

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `transport.tls.enable` | `client/connector.go:111` | 是否启用 TLS |
| `transport.tls.certFile` / `.keyFile` | `client/connector.go:113-114` | mTLS 证书加载（空则跳过） |
| `transport.tls.trustedCaFile` | `client/connector.go:115` | CA 证书 |
| `transport.tls.serverName` | `client/connector.go:107` | TLS SNI |
| `transport.tls.disableCustomTLSFirstByte` | `client/connector.go:220,230` | 自定义首字节开关（仅 TCP 生效） |

## TLS — QUIC 模式

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `transport.tls.enable` | `client/connector.go:111`（QUIC 分支） | QUIC 强制 TLS |
| `transport.tls.certFile` / `.keyFile` | `client/connector.go:113-114`（QUIC 分支） | QUIC 客户端证书 |
| `transport.tls.trustedCaFile` | `client/connector.go:115`（QUIC 分支） | CA 证书 |
| `transport.tls.serverName` | `client/connector.go:107`（QUIC 分支） | TLS SNI |
| `transport.tls.disableCustomTLSFirstByte` | ❌ QUIC 路径不读 | 仅在 TCP 路径使用 |

## QUIC 协议选项

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `transport.quic.keepalivePeriod` | `client/connector.go:132` | quic-go PING 帧间隔 |
| `transport.quic.maxIdleTimeout` | `client/connector.go:130` | 空闲超时断连 |
| `transport.quic.maxIncomingStreams` | `client/connector.go:131` | 最大并发流数 |

## 控制会话初始化

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `transport.protocol` | `client/control_session.go:150` | 决定连接是否启用 TLS |
| `transport.wireProtocol` | `client/control_session.go:98,100,140` | 消息读写器版本 |
| `transport.poolCount` | `client/control.go:116-119` | 登录时发送给 frps |

## 日志

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `log.to` | `pkg/util/log/log.go:60-72` | 初始化 log 输出目标 |
| `log.level` | `pkg/util/log/log.go:52` | 设置日志级别 |
| `log.maxDays` | `pkg/util/log/log.go:85-90` | 日志轮转清理 |

## 代理配置详解

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `name` | 元数据传递 | 唯一标识 |
| `type` | `client/proxy/proxy.go:35-42` | 选择代理类型实现 |
| `enabled` | `client/proxy/proxy.go:110` | 跳过已禁用的代理 |
| `customDomains` | 发送给 frps | 域名路由匹配 |
| `subdomain` | 发送给 frps | 子域名路由匹配 |
| `locations` | HTTP 代理特有 | URL 路径匹配 |
| `httpUser` / `httpPassword` | HTTP 代理特有 | Basic Auth |

## 服务端相关 (frps)

| 配置项 | 生效位置 | 作用 |
|--------|---------|------|
| `bindPort` | `server/service.go:130` | TCP 监听端口 |
| `quicBindPort` | `server/service.go:140` | QUIC UDP 监听端口 |
| `transport.maxPoolCount` | `server/proxy/proxy.go:85-90` | 服务端连接池上限 |
| `userConnTimeout` | `server/proxy/proxy.go:151-155` | 空池等待超时 |

---

## 快速定位步骤

1. **确定搜索词** — 配置的 Go 变量名（如 `UseCompression`）
2. **在 `client/` 下搜索** — 客户端逻辑：`grep -r "UseCompression" client/`
3. **在 `server/` 下搜索** — 服务端逻辑：`grep -r "maxPoolCount" server/`
4. **在 `pkg/` 下搜索** — 工具/中间件：`grep -r "HTTPAuthMiddleware" pkg/`

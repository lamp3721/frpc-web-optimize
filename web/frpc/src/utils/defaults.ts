// defaults.ts — 配置项默认值字典
// 与 pkg/config/v1/client.go、common.go 的 Complete() 方法对齐
//
// key: TOML 路径（点键格式）
// value: 默认值
// nil 表示无默认值（必配）

export const CONFIG_DEFAULTS: Record<string, any> = {
  // 基础连接
  'serverAddr': '0.0.0.0',
  'serverPort': 7000,

  // 认证
  'auth.method': 'token',
  'auth.token': null,          // 无默认，必配

  // 传输
  'transport.protocol': 'tcp',
  'transport.wireProtocol': 'v1',
  'transport.tcpMux': true,
  'transport.tcpMuxKeepaliveInterval': 30,
  'transport.dialServerKeepalive': 7200,
  'transport.dialServerTimeout': 10,
  'transport.poolCount': 1,
  // 心跳 — 条件默认（tcpMux=true → -1, tcpMux=false → 30/90）
  'transport.heartbeatInterval': null,   // 取决于 tcpMux
  'transport.heartbeatTimeout': null,    // 取决于 tcpMux

  // TLS
  'transport.tls.enable': true,
  'transport.tls.disableCustomTLSFirstByte': true,
  'transport.tls.certFile': '',
  'transport.tls.keyFile': '',
  'transport.tls.trustedCaFile': '',
  'transport.tls.serverName': '',

  // QUIC
  'transport.quic.keepalivePeriod': 10,
  'transport.quic.maxIdleTimeout': 30,
  'transport.quic.maxIncomingStreams': 100000,

  // WebServer
  'webServer.addr': '127.0.0.1',
  'webServer.port': null,        // 0=不启用，无默认
  'webServer.user': null,
  'webServer.password': null,

  // 日志
  'log.to': 'console',
  'log.level': 'info',
  'log.maxDays': 3,

  // 代理
  'proxies[].enabled': true,
  'proxies[].localIP': '127.0.0.1',
  'proxies[].transport.useCompression': false,
  'proxies[].transport.useEncryption': false,
}

// 根据 tcpMux 计算心跳默认值
export function heartbeatDefaults(tcpMux: boolean) {
  return tcpMux
    ? { interval: -1, timeout: -1 }
    : { interval: 30, timeout: 90 }
}

// 判断字段是否必配（无默认值）
export function isRequired(key: string): boolean {
  return CONFIG_DEFAULTS[key] === null
}

// 格式化默认值显示
export function formatDefault(key: string): string {
  const val = CONFIG_DEFAULTS[key]
  if (val === null) return ''
  if (val === true) return '默认开启'
  if (val === false) return '默认关闭'
  if (val === '') return '默认空'
  if (typeof val === 'number') return `默认 ${val}`
  return `默认 ${val}`
}

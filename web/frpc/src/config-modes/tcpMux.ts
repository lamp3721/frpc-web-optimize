// mode-tcpMux.ts — 多路复用模式（默认/推荐）
// 对应 pattern_doc/多路复用.md

import { CONFIG_DEFAULTS } from '../utils/defaults'

export const MODE = 'tcpMux' as const
export const LABEL = '多路复用'
export const DESC = 'TCP Mux 流复用，低延迟推荐'

// 必配字段（无默认值或必须显式设置）
export const REQUIRED = [
  'serverAddr',
  'auth.token',
] as const

// 必配区显示字段
export const VISIBLE = [
  'serverAddr',
  'auth.token',
] as const

// 可选字段（有默认值，一般不需要改）
// 字段名 → 是否在这个模式中生效
export const OPTIONAL: Record<string, { effective: boolean; note?: string }> = {
  'serverPort':                    { effective: true },
  'transport.tcpMuxKeepaliveInterval': { effective: true, note: 'yamux 保活 ping，默认 30s 已覆盖绝大多数场景' },
  'transport.dialServerKeepalive': { effective: true, note: 'yamux 接管保活，默认 7200s 永远不会触发' },
  'transport.dialServerTimeout':   { effective: true },
  'transport.poolCount':           { effective: true, note: '默认 1，高并发可调大' },
  'transport.wireProtocol':        { effective: true },
  'transport.tls.enable':          { effective: true },
  'transport.tls.disableCustomTLSFirstByte': { effective: true },
  'transport.tls.certFile':        { effective: true, note: 'mTLS 场景才需要' },
  'transport.tls.keyFile':         { effective: true, note: 'mTLS 场景才需要' },
  // 以下在本模式中不生效（Complete() 自动禁用）
  'transport.heartbeatInterval':   { effective: false, note: 'tcpMux=true 时 Go 自动设为 -1（禁用）' },
  'transport.heartbeatTimeout':    { effective: false, note: 'tcpMux=true 时 Go 自动设为 -1（禁用）' },
  'transport.quic.keepalivePeriod': { effective: false },
  'transport.quic.maxIdleTimeout': { effective: false },
  'transport.quic.maxIncomingStreams': { effective: false },
  'webServer.port':                { effective: true },
  'webServer.user':                { effective: true },
  'webServer.password':            { effective: true },
}

// 字段预设值（切换到此模式时自动应用）
export const PRESET: Record<string, any> = {
  'transport.tcpMux': true,
}

// 默认值引用
export const DEFAULTS = CONFIG_DEFAULTS

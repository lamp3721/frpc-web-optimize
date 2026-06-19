// mode-tcpNoMux.ts — TCP 直连模式（无多路复用）
// 对应 pattern_doc/连接池.md

import { CONFIG_DEFAULTS } from '../utils/defaults'

export const MODE = 'tcpNoMux' as const
export const LABEL = 'TCP 直连'
export const DESC = '无多路复用，独立 TCP 连接探活'

// 必配 + 本模式关键字段
export const REQUIRED = [
  'serverAddr',
  'auth.token',
  'transport.tcpMux',           // 必须显式写 false
  'transport.dialServerKeepalive', // 默认 7200s，必须调到 60s
  'transport.poolCount',        // 默认 1，必须调到 5
] as const

export const VISIBLE = REQUIRED

// 可选字段
export const OPTIONAL: Record<string, { effective: boolean; note?: string }> = {
  'serverPort':                    { effective: true },
  'transport.dialServerTimeout':   { effective: true },
  // heartbeat 在本模式下自动生效（30s/90s）
  'transport.heartbeatInterval':   { effective: true, note: 'tcpMux=false 时 Go 自动设为 30s，仅控制连接' },
  'transport.heartbeatTimeout':    { effective: true, note: 'tcpMux=false 时 Go 自动设为 90s，仅控制连接' },
  'transport.tls.enable':          { effective: true },
  'transport.tls.disableCustomTLSFirstByte': { effective: true },
  'transport.tls.certFile':        { effective: true, note: 'mTLS 场景才需要' },
  'transport.tls.keyFile':         { effective: true, note: 'mTLS 场景才需要' },
  // 以下在本模式中不生效
  'transport.tcpMuxKeepaliveInterval': { effective: false, note: 'tcpMux=false，yamux 未启用' },
  'transport.wireProtocol':        { effective: false },
  'transport.quic.keepalivePeriod':  { effective: false },
  'transport.quic.maxIdleTimeout': { effective: false },
  'transport.quic.maxIncomingStreams': { effective: false },
  'webServer.port':                { effective: true },
  'webServer.user':                { effective: true },
  'webServer.password':            { effective: true },
}

export const PRESET: Record<string, any> = {
  'transport.tcpMux': false,
}

export const DEFAULTS = CONFIG_DEFAULTS

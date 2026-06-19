// mode-quic.ts — QUIC 模式
// 对应 pattern_doc/QUIC.md

import { CONFIG_DEFAULTS } from '../utils/defaults'

export const MODE = 'quic' as const
export const LABEL = 'QUIC'
export const DESC = 'UDP 协议，抗丢包弱网环境'

export const REQUIRED = [
  'serverAddr',
  'auth.token',
  'transport.protocol',   // 必须显式写 "quic"
] as const

export const VISIBLE = REQUIRED

export const OPTIONAL: Record<string, { effective: boolean; note?: string }> = {
  'serverPort':                    { effective: true },
  'transport.poolCount':           { effective: true, note: '默认 1，QUIC 建议 ≥3' },
  'transport.tls.enable':          { effective: true, note: 'QUIC 强制 TLS 1.3，必须 true' },
  'transport.tls.disableCustomTLSFirstByte': { effective: true },
  'transport.tls.certFile':        { effective: true, note: '服务端必须提供证书' },
  'transport.tls.keyFile':         { effective: true, note: '服务端必须提供证书' },
  'transport.tls.serverName':      { effective: true, note: 'TLS SNI，空=serverAddr' },
  'transport.quic.keepalivePeriod':  { effective: true, note: '默认 10s，维持 UDP/NAT 映射' },
  'transport.quic.maxIdleTimeout': { effective: true, note: '默认 30s，空闲超时断连' },
  'transport.quic.maxIncomingStreams': { effective: true, note: '默认 100000' },
  // 以下在本模式中不生效
  'transport.tcpMux':                { effective: false, note: 'QUIC 自身多路复用，不使用 yamux' },
  'transport.tcpMuxKeepaliveInterval': { effective: false },
  'transport.dialServerKeepalive':  { effective: false, note: 'UDP 无 TCP keepalive' },
  'transport.dialServerTimeout':    { effective: false },
  'transport.wireProtocol':         { effective: false },
  'transport.heartbeatInterval':    { effective: false, note: 'QUIC PING 帧替代应用层心跳' },
  'transport.heartbeatTimeout':     { effective: false },
  'webServer.port':                 { effective: true },
  'webServer.user':                 { effective: true },
  'webServer.password':             { effective: true },
}

export const PRESET: Record<string, any> = {
  'transport.tcpMux': false,
}

export const DEFAULTS = CONFIG_DEFAULTS

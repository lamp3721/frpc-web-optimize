// config-modes/index.ts — 模式配置入口

import * as tcpMux from './tcpMux'
import * as tcpNoMux from './tcpNoMux'
import * as quic from './quic'

export type ModeId = 'tcpMux' | 'tcpNoMux' | 'quic'

export interface ModeConfig {
  id: ModeId
  label: string
  desc: string
  required: readonly string[]
  visible: readonly string[]
  optional: Record<string, { effective: boolean; note?: string }>
  preset: Record<string, any>
  defaults: Record<string, any>
}

export const MODES: Record<ModeId, ModeConfig> = {
  tcpMux: {
    id: tcpMux.MODE,
    label: tcpMux.LABEL,
    desc: tcpMux.DESC,
    required: tcpMux.REQUIRED,
    visible: tcpMux.VISIBLE,
    optional: tcpMux.OPTIONAL,
    preset: tcpMux.PRESET,
    defaults: tcpMux.DEFAULTS,
  },
  tcpNoMux: {
    id: tcpNoMux.MODE,
    label: tcpNoMux.LABEL,
    desc: tcpNoMux.DESC,
    required: tcpNoMux.REQUIRED,
    visible: tcpNoMux.VISIBLE,
    optional: tcpNoMux.OPTIONAL,
    preset: tcpNoMux.PRESET,
    defaults: tcpNoMux.DEFAULTS,
  },
  quic: {
    id: quic.MODE,
    label: quic.LABEL,
    desc: quic.DESC,
    required: quic.REQUIRED,
    visible: quic.VISIBLE,
    optional: quic.OPTIONAL,
    preset: quic.PRESET,
    defaults: quic.DEFAULTS,
  },
}

// 判断字段在指定模式下是否生效
export function isEffective(mode: ModeId, key: string): boolean {
  return MODES[mode]?.optional[key]?.effective !== false
}

// 判断字段在指定模式下是否必配
export function isRequiredInMode(mode: ModeId, key: string): boolean {
  return MODES[mode]?.required.includes(key) ?? false
}

// 获取字段在指定模式下的说明
export function getNote(mode: ModeId, key: string): string | undefined {
  return MODES[mode]?.optional[key]?.note
}

// 获取模式的预设值
export function getPreset(mode: ModeId): Record<string, any> {
  return MODES[mode]?.preset ?? {}
}

export interface FrpcConfig {
  roots: Record<string, any>
  sections: Record<string, Record<string, any>>
  proxies: Record<string, any>[]
  visitors: Record<string, any>[]
  order: string[]
}

export function parseToml(text: string): FrpcConfig {
  const result: FrpcConfig = {
    roots: {},
    sections: {},
    proxies: [],
    visitors: [],
    order: [],
  }

  const lines = text.split('\n')
  let currentSection: string | null = null
  let currentTable: Record<string, any> | null = null
  let inRoot = true

  const isSection = (line: string): string | null => {
    const m = line.trim().match(/^\[([^\]]+)\]$/)
    return m ? m[1].trim() : null
  }

  const isArrayTable = (line: string): string | null => {
    const m = line.trim().match(/^\[\[([^\]]+)\]\]$/)
    return m ? m[1].trim() : null
  }

  const isKeyValue = (line: string) => {
    return line.includes('=') && !line.trim().startsWith('#')
  }

  // 按顶层逗号切分（尊重引号与花括号/方括号嵌套）
  const splitTopLevel = (s: string): string[] => {
    const parts: string[] = []
    let depth = 0
    let quote = false
    let current = ''
    for (const ch of s) {
      if (quote) {
        current += ch
        if (ch === '"') quote = false
        continue
      }
      if (ch === '"') { quote = true; current += ch; continue }
      if (ch === '{' || ch === '[') { depth++; current += ch; continue }
      if (ch === '}' || ch === ']') { depth--; current += ch; continue }
      if (ch === ',' && depth === 0) { parts.push(current.trim()); current = ''; continue }
      current += ch
    }
    if (current.trim() !== '' || parts.length > 0) parts.push(current.trim())
    return parts.filter((p) => p !== '')
  }

  const parseInlineTable = (raw: string): Record<string, any> => {
    // raw 形如 { name = "x", value = "y" }
    const inner = raw.trim().slice(1, -1).trim()
    const out: Record<string, any> = {}
    if (!inner) return out
    for (const pair of splitTopLevel(inner)) {
      const eq = pair.indexOf('=')
      if (eq < 0) continue
      const k = pair.slice(0, eq).trim().replace(/^"|"$/g, '')
      out[k] = parseRawValue(pair.slice(eq + 1))
    }
    return out
  }

  const parseRawValue = (raw: string): any => {
    const trimmed = raw.trim()
    if (trimmed === 'true') return true
    if (trimmed === 'false') return false
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)
    if (trimmed.startsWith('"') && trimmed.endsWith('"'))
      return trimmed.slice(1, -1)
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return parseInlineTable(trimmed)
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const inner = trimmed.slice(1, -1).trim()
      if (!inner) return []
      return splitTopLevel(inner).map((v) => parseRawValue(v))
    }
    return trimmed
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed === '' || trimmed.startsWith('#')) {
      result.order.push(line)
      continue
    }

    const arrTable = isArrayTable(trimmed)
    if (arrTable) {
      currentSection = `[[${arrTable}]]`
      currentTable = {}
      inRoot = false
      if (arrTable === 'proxies') {
        result.proxies.push(currentTable)
      } else if (arrTable === 'visitors') {
        result.visitors.push(currentTable)
      } else {
        result.order.push(line)
      }
      continue
    }

    const sec = isSection(trimmed)
    if (sec) {
      currentSection = sec
      inRoot = false
      currentTable = null
      if (!result.sections[sec]) {
        result.sections[sec] = {}
        result.order.push(`__section:${sec}`)
      }
      continue
    }

    if (isKeyValue(trimmed)) {
      const eqIdx = trimmed.indexOf('=')
      const key = trimmed.slice(0, eqIdx).trim()
      const value = parseRawValue(trimmed.slice(eqIdx + 1))

      if (inRoot) {
        // 根级点号键（metadatas.var1 = "abc"）→ 视为节（TOML 语义即嵌套表）
        if (key.includes('.')) {
          const dotIdx = key.indexOf('.')
          const secName = key.slice(0, dotIdx)
          const subKey = key.slice(dotIdx + 1)
          if (!result.sections[secName]) {
            result.sections[secName] = {}
            result.order.push(`__section:${secName}`)
          }
          result.sections[secName][subKey] = value
          continue
        }
        // 根级内联表（featureGates = { VirtualNet = true }）→ 视为节
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          if (!result.sections[key]) {
            result.sections[key] = {}
            result.order.push(`__section:${key}`)
          }
          Object.assign(result.sections[key], value)
          continue
        }
        result.roots[key] = value
        continue
      }

      if (currentTable) {
        currentTable[key] = value
      } else if (currentSection) {
        result.sections[currentSection][key] = value
      } else {
        result.order.push(line)
      }
      continue
    }

    result.order.push(line)
  }

  return result
}

// ==================== SERIALIZER ====================

function formatValue(value: any): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) {
    const items = value.map((v) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        // 内联表数组元素：{ name = "x", value = "y" }
        const pairs = Object.entries(v)
          .map(([ik, iv]) => `${ik} = ${formatValue(iv)}`)
          .join(', ')
        return `{ ${pairs} }`
      }
      return `"${String(v)}"`
    })
    return `[${items.join(', ')}]`
  }
  if (typeof value === 'object') {
    // 内联表
    const pairs = Object.entries(value)
      .map(([k, v]) => `${k} = ${formatValue(v)}`)
      .join(', ')
    return `{ ${pairs} }`
  }
  const s = String(value)
  if (s === '') return '""'
  return `"${s}"`
}

function writeKV(lines: string[], key: string, value: any) {
  if (value === '' || value === undefined || value === null) return
  lines.push(`${key} = ${formatValue(value)}`)
}

function writeSection(lines: string[], prefix: string, data: Record<string, any>) {
  const flat: string[] = []
  const nested: { key: string; data: Record<string, any> }[] = []

  for (const key of Object.keys(data)) {
    const val = data[key]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      nested.push({ key, data: val })
    } else {
      flat.push(key)
    }
  }

  if (flat.length > 0) {
    lines.push(`[${prefix}]`)
    for (const key of flat) {
      writeKV(lines, key, data[key])
    }
    lines.push('')
  }

  for (const { key, data: subData } of nested) {
    writeSection(lines, `${prefix}.${key}`, subData)
  }
}

export function serializeToml(config: FrpcConfig): string {
  const lines: string[] = []

  // Root-level keys
  for (const key of Object.keys(config.roots)) {
    writeKV(lines, key, config.roots[key])
  }
  if (Object.keys(config.roots).length > 0) {
    lines.push('')
  }

  // Sections with sub-table support
  const sectionNames = config.order
    .filter((o) => o.startsWith('__section:'))
    .map((o) => o.slice(10))

  for (const name of sectionNames) {
    const data = config.sections[name]
    if (!data || Object.keys(data).length === 0) continue
    writeSection(lines, name, data)
  }

  for (const name of Object.keys(config.sections)) {
    if (sectionNames.includes(name)) continue
    const data = config.sections[name]
    if (!data || Object.keys(data).length === 0) continue
    writeSection(lines, name, data)
  }

  // Proxies
  for (const proxy of config.proxies) {
    const keys = Object.keys(proxy).filter(
      (k) => proxy[k] !== '' && proxy[k] !== undefined && proxy[k] !== null,
    )
    if (keys.length === 0) continue
    lines.push('[[proxies]]')
    for (const key of keys) {
      writeKV(lines, key, proxy[key])
    }
    lines.push('')
  }

  // Visitors
  for (const visitor of config.visitors) {
    const keys = Object.keys(visitor).filter(
      (k) => visitor[k] !== '' && visitor[k] !== undefined && visitor[k] !== null,
    )
    if (keys.length === 0) continue
    lines.push('[[visitors]]')
    for (const key of keys) {
      writeKV(lines, key, visitor[key])
    }
    lines.push('')
  }

  return lines.join('\n').trim() + '\n'
}

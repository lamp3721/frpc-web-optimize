import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'frpc_connection'

export const useConnectionStore = defineStore('connection', () => {
  const protocol = ref<'http' | 'https'>('http')
  const host = ref('')
  const port = ref('')
  const username = ref('')
  const password = ref('')

  // Auto-parse full URLs pasted into the host field
  watch(host, (val) => {
    const m = val.match(/^(https?):\/\/([^/:]+)(?::(\d+))?(.*)$/)
    if (m) {
      host.value = m[2]
      protocol.value = m[1] as 'http' | 'https'
      port.value = m[3] || (m[1] === 'https' ? '443' : '80')
    }
  })

  const baseUrl = computed(() => {
    if (!host.value) return ''
    const p = port.value ? `:${port.value}` : ''
    return `${protocol.value}://${host.value}${p}`
  })

  const connected = computed(() => !!host.value)

  const authHeader = computed(() => {
    if (!username.value || !password.value) return ''
    return 'Basic ' + btoa(`${username.value}:${password.value}`)
  })

  const load = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        protocol.value = data.protocol || 'http'
        host.value = data.host || ''
        port.value = data.port || ''
        username.value = data.username || ''
        password.value = data.password || ''
      }
    } catch {
      // corrupted data, ignore
    }
  }

  const save = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        protocol: protocol.value,
        host: host.value,
        port: port.value,
        username: username.value,
        password: password.value,
      }),
    )
  }

  const syncProxyTarget = () => {
    if (!host.value) return Promise.resolve()
    const p = port.value ? `:${port.value}` : ''
    const target = `${protocol.value}://${host.value}${p}`
    return fetch('/__proxy_target', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target }),
    }).catch(() => {
      // silent fail — not running under vite dev server
    })
  }

  const disconnect = () => {
    host.value = ''
    port.value = ''
    protocol.value = 'http'
    username.value = ''
    password.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  load()

  return {
    protocol,
    host,
    port,
    username,
    password,
    baseUrl,
    connected,
    authHeader,
    save,
    syncProxyTarget,
    disconnect,
  }
})

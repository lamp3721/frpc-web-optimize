<template>
  <!-- Backend Mode -->
  <template v-if="!readonly">
    <el-form-item label="后端模式">
      <el-radio-group v-model="backendMode">
        <el-radio value="direct">直连</el-radio>
        <el-radio value="plugin">插件</el-radio>
      </el-radio-group>
    </el-form-item>
  </template>

  <!-- Direct mode -->
  <template v-if="backendMode === 'direct'">
    <div class="field-row two-col">
      <ConfigField label="本地 IP" type="text" v-model="form.localIP" placeholder="127.0.0.1" :readonly="readonly" tooltip="内网服务的 IP 地址。通常是 127.0.0.1（本机）或内网其他机器的 IP。" />
      <ConfigField label="本地端口" type="number" v-model="form.localPort" :min="0" :max="65535" prop="localPort" :readonly="readonly" tooltip="内网服务监听的端口。例如 SSH=22、HTTP=80、自定义应用端口。" />
    </div>
  </template>

  <!-- Plugin mode -->
  <template v-else>
    <div class="field-row two-col">
      <ConfigField label="插件类型" type="select" v-model="form.pluginType"
        :options="PLUGIN_LIST.map((p) => ({ label: p, value: p }))" :readonly="readonly"
        tooltip="插件在 frpc 本地处理流量（终止 TLS、反代等），代替直连本地端口。" />
      <div></div>
    </div>
    <div v-if="pluginDescription" class="plugin-description">{{ pluginDescription }}</div>

    <el-alert
      v-if="form.type === 'https' && (form.pluginType === 'https2http' || form.pluginType === 'https2https')"
      type="info" :closable="false" class="scenario-alert"
      title="HTTPS 终止转发方案">
      <p>访问链路：客户端 <b>—HTTPS→</b> frps:443（vhostHTTPSPort，按 SNI 加密透传）<b>—加密隧道→</b> frpc 用下方证书终止 TLS <b>—明文→</b> 本地地址（如 127.0.0.1:80）。</p>
      <p v-if="form.pluginType === 'https2http'">下游 Nginx / NPM 只需明文 HTTP 监听，<b>无需配置证书</b>；真实客户端 IP 由插件自动通过 X-Forwarded-For 头传递，传输区无需设置代理协议。</p>
      <p v-else>下游服务需自行支持 HTTPS（收到的是 TLS 流量）。</p>
      <p>证书更新后执行 frpc reload 即可热加载，无需重启。</p>
    </el-alert>

    <template v-if="['http2https', 'https2http', 'https2https', 'http2http', 'tls2raw'].includes(form.pluginType)">
      <div class="field-row two-col">
        <ConfigField label="本地地址" type="text" v-model="form.pluginConfig.localAddr"
          placeholder="127.0.0.1:80" :readonly="readonly" :tip="localAddrTip"
          tooltip="插件处理后流量最终转发到的目标地址（IP:Port 格式）。典型场景：127.0.0.1:80，即下游 Nginx/NPM 的明文 HTTP 监听端口。" />
        <ConfigField v-if="['http2https', 'https2http', 'https2https', 'http2http'].includes(form.pluginType)"
          label="Host 头重写" type="text" v-model="form.pluginConfig.hostHeaderRewrite" :readonly="readonly"
          tooltip="重写转发请求的 Host 头。留空保留原始 Host——下游 Nginx/NPM 依靠 Host 区分站点时务必留空。" />
        <div v-else></div>
      </div>
    </template>
    <template v-if="['http2https', 'https2http', 'https2https', 'http2http'].includes(form.pluginType)">
      <ConfigField label="请求头" type="kv" v-model="pluginRequestHeaders"
        key-placeholder="Header" value-placeholder="值" :readonly="readonly"
        tooltip="附加到转发请求的静态请求头。真实客户端 IP 无需手动设置，插件会自动通过 X-Forwarded-For 传递。" />
    </template>
    <template v-if="['https2http', 'https2https', 'tls2raw'].includes(form.pluginType)">
      <div class="field-row two-col">
        <ConfigField label="证书路径" type="text" v-model="form.pluginConfig.crtPath"
          placeholder="/path/to/cert.pem" :readonly="readonly" :tip="certPairTip"
          tooltip="PEM 证书文件在 frpc 机器上的路径。frps 之间是加密透传，TLS 在 frpc 本地用此证书终止。" />
        <ConfigField label="密钥路径" type="text" v-model="form.pluginConfig.keyPath"
          placeholder="/path/to/key.pem" :readonly="readonly" :tip="certPairTip"
          tooltip="PEM 私钥文件路径，与证书路径成对使用。" />
      </div>
    </template>
    <template v-if="['https2http', 'https2https'].includes(form.pluginType)">
      <ConfigField label="启用 HTTP/2" type="switch" v-model="form.pluginConfig.enableHTTP2" :readonly="readonly"
        tooltip="允许客户端与 frpc 之间使用 HTTP/2，需要证书支持 ALPN h2。" />
    </template>
    <template v-if="form.pluginType === 'http_proxy'">
      <div class="field-row two-col">
        <ConfigField label="HTTP 用户" type="text" v-model="form.pluginConfig.httpUser" :readonly="readonly" />
        <ConfigField label="HTTP 密码" type="password" v-model="form.pluginConfig.httpPassword" :readonly="readonly" />
      </div>
    </template>
    <template v-if="form.pluginType === 'socks5'">
      <div class="field-row two-col">
        <ConfigField label="用户名" type="text" v-model="form.pluginConfig.username" :readonly="readonly" />
        <ConfigField label="密码" type="password" v-model="form.pluginConfig.password" :readonly="readonly" />
      </div>
    </template>
    <template v-if="form.pluginType === 'static_file'">
      <div class="field-row two-col">
        <ConfigField label="本地路径" type="text" v-model="form.pluginConfig.localPath" placeholder="/path/to/files" :readonly="readonly" />
        <ConfigField label="去掉前缀" type="text" v-model="form.pluginConfig.stripPrefix" :readonly="readonly" />
      </div>
      <div class="field-row two-col">
        <ConfigField label="HTTP 用户" type="text" v-model="form.pluginConfig.httpUser" :readonly="readonly" />
        <ConfigField label="HTTP 密码" type="password" v-model="form.pluginConfig.httpPassword" :readonly="readonly" />
      </div>
    </template>
    <template v-if="form.pluginType === 'unix_domain_socket'">
      <ConfigField label="Unix Socket 路径" type="text" v-model="form.pluginConfig.unixPath" placeholder="/tmp/socket.sock" :readonly="readonly" />
    </template>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import type { ProxyFormData } from '../../types'
import ConfigField from '../ConfigField.vue'

const PLUGIN_LIST = [
  'http2https', 'http_proxy', 'https2http', 'https2https', 'http2http',
  'socks5', 'static_file', 'unix_domain_socket', 'tls2raw', 'virtual_net',
]

const PLUGIN_DESCRIPTIONS: Record<string, string> = {
  http2https: '将 frps 收到的明文 HTTP 加密为 HTTPS 后转发给本地服务（本地服务需支持 TLS）。',
  https2http: '在 frpc 本地用证书终止 HTTPS（解密），把明文 HTTP 转发给本地服务，下游无需证书。',
  https2https: '在 frpc 本地用证书终止 HTTPS，再以 HTTPS 转发给本地服务。',
  http2http: '把明文 HTTP 请求转发给本地服务，可改写 Host 头和请求头。',
  tls2raw: '在 frpc 本地终止 TLS，把解密后的原始字节流转发给本地 TCP 服务。',
  http_proxy: '在 frpc 本地启动一个 HTTP 代理，可通过 frps 隧道使用内网代理。',
  socks5: '在 frpc 本地启动一个 SOCKS5 代理，可通过 frps 隧道使用内网代理。',
  static_file: '直接在 frpc 上提供本地静态文件目录的 HTTP 服务。',
  unix_domain_socket: '把流量转发给本地的 Unix Domain Socket 服务。',
  virtual_net: '虚拟网络插件，配合 TUN 设备使用。',
}

const props = withDefaults(defineProps<{
  modelValue: ProxyFormData
  readonly?: boolean
}>(), { readonly: false })

const emit = defineEmits<{ 'update:modelValue': [value: ProxyFormData] }>()

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const pluginDescription = computed(() => PLUGIN_DESCRIPTIONS[form.value.pluginType] || '')

// 本地地址格式校验提示（IP:Port）
const localAddrTip = computed(() => {
  const v = String(form.value.pluginConfig?.localAddr || '').trim()
  if (!v) return ''
  const m = v.match(/^\[?([^\]]*)\]?:(\d+)$/)
  if (!m) return '格式应为 IP:端口，例如 127.0.0.1:80'
  const port = Number(m[2])
  if (port < 1 || port > 65535) return '端口范围为 1-65535'
  return ''
})

// 证书与私钥需成对填写
const certPairTip = computed(() => {
  if (!['https2http', 'https2https', 'tls2raw'].includes(form.value.pluginType)) return ''
  const hasCrt = !!form.value.pluginConfig?.crtPath
  const hasKey = !!form.value.pluginConfig?.keyPath
  if (hasCrt !== hasKey) return '证书路径与密钥路径需成对填写'
  return ''
})

const backendMode = ref<'direct' | 'plugin'>(form.value.pluginType ? 'plugin' : 'direct')
const isHydrating = ref(false)

const pluginRequestHeaders = computed({
  get() {
    const set = form.value.pluginConfig?.requestHeaders?.set
    if (!set || typeof set !== 'object') return []
    return Object.entries(set).map(([key, value]) => ({ key, value: String(value) }))
  },
  set(val: Array<{ key: string; value: string }>) {
    if (!form.value.pluginConfig) form.value.pluginConfig = {}
    if (val.length === 0) {
      delete form.value.pluginConfig.requestHeaders
    } else {
      form.value.pluginConfig.requestHeaders = {
        set: Object.fromEntries(val.map((e) => [e.key, e.value])),
      }
    }
  },
})

watch(() => form.value.pluginType, (newType, oldType) => {
  if (isHydrating.value) return
  if (!oldType || !newType || newType === oldType) return
  if (form.value.pluginConfig && Object.keys(form.value.pluginConfig).length > 0) {
    form.value.pluginConfig = {}
  }
})

watch(backendMode, (mode) => {
  if (mode === 'direct') {
    form.value.pluginType = ''
    form.value.pluginConfig = {}
  } else if (!form.value.pluginType) {
    form.value.pluginType = 'http2https'
  }
})

const hydrate = () => {
  isHydrating.value = true
  backendMode.value = form.value.pluginType ? 'plugin' : 'direct'
  nextTick(() => { isHydrating.value = false })
}

watch(() => props.modelValue, () => { hydrate() })
onMounted(() => { hydrate() })
</script>

<style scoped lang="scss">
@use '@/assets/css/form-layout';

.plugin-description {
  grid-column: 1 / -1;
  margin-top: -4px;
  margin-bottom: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.scenario-alert {
  grid-column: 1 / -1;
  margin-bottom: 12px;

  :deep(p) {
    margin: 2px 0;
    line-height: 1.7;
    font-size: 13px;
  }
}
</style>

<template>
  <template v-if="['tcp', 'udp'].includes(form.type)">
    <div class="field-row two-col">
      <ConfigField label="远程端口" type="number" v-model="form.remotePort"
        :min="0" :max="65535" prop="remotePort" tip="使用 0 随机分配端口" tooltip="frps 服务器上对外开放的端口，外部用户通过此端口访问你的内网服务。设为 0 表示由 frps 随机分配。" :readonly="readonly" />
      <div></div>
    </div>
  </template>
  <template v-if="['http', 'https', 'tcpmux'].includes(form.type)">
    <div class="field-row two-col">
      <ConfigField label="自定义域名" type="tags" v-model="form.customDomains"
        prop="customDomains" placeholder="example.com" tooltip="绑定到此代理的域名列表。用户通过此域名 + frps 端口访问你的 HTTP/HTTPS 服务。支持泛域名如 *.example.com。" :readonly="readonly" />
      <ConfigField v-if="form.type !== 'tcpmux'" label="子域名" type="text"
        v-model="form.subdomain" placeholder="test" tooltip="子域名前缀。配合 frps 配置的 subdomainHost 使用。例如填 test，完整域名为 test.subdomainHost。" :readonly="readonly" />
      <ConfigField v-if="form.type === 'tcpmux'" label="复用器" type="select"
        v-model="form.multiplexer" :options="[{ label: 'HTTP CONNECT', value: 'httpconnect' }]" tooltip="TCPMux 模式下使用的复用协议。目前仅支持 HTTP CONNECT 复用器。" :readonly="readonly" />
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProxyFormData } from '../../types'
import ConfigField from '../ConfigField.vue'

const props = withDefaults(defineProps<{
  modelValue: ProxyFormData
  readonly?: boolean
}>(), { readonly: false })

const emit = defineEmits<{ 'update:modelValue': [value: ProxyFormData] }>()

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<style scoped lang="scss">
@use '@/assets/css/form-layout';
</style>

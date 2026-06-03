<template>
  <ConfigSection title="传输" collapsible :readonly="readonly"
    :has-value="form.useEncryption || form.useCompression || !!form.bandwidthLimit || (!!form.bandwidthLimitMode && form.bandwidthLimitMode !== 'client') || !!form.proxyProtocolVersion">
    <div class="field-row two-col">
      <ConfigField label="加密传输" type="switch" v-model="form.useEncryption" :readonly="readonly" tooltip="启用后 frpc 与 frps 之间的数据传输会加密。建议生产环境开启。" />
      <ConfigField label="压缩传输" type="switch" v-model="form.useCompression" :readonly="readonly" tooltip="启用后传输数据会压缩，节省带宽但消耗 CPU。高流量场景建议开启。" />
    </div>
    <div class="field-row three-col">
      <ConfigField label="带宽限制" type="text" v-model="form.bandwidthLimit" placeholder="1MB" tip="例如 1MB, 500KB" :readonly="readonly" tooltip="限制此代理的最大传输速率。格式如 1MB、500KB。留空表示不限速。" />
      <ConfigField label="带宽限制模式" type="select" v-model="form.bandwidthLimitMode"
        :options="[{ label: '客户端', value: 'client' }, { label: '服务端', value: 'server' }]" :readonly="readonly" tooltip="客户端=由 frpc 侧限速，服务端=由 frps 侧限速。一般选客户端即可。" />
      <ConfigField label="代理协议版本" type="select" v-model="form.proxyProtocolVersion"
        :options="[{ label: '无', value: '' }, { label: 'v1', value: 'v1' }, { label: 'v2', value: 'v2' }]" :readonly="readonly" tooltip="PROXY Protocol 版本，用于向后端传递真实客户端 IP。None=不使用，v1/v2 需要后端支持。" />
    </div>
  </ConfigSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProxyFormData } from '../../types'
import ConfigSection from '../ConfigSection.vue'
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

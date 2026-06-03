<template>
  <ConfigSection title="健康检查" collapsible :readonly="readonly" :has-value="!!form.healthCheckType">
    <div class="field-row two-col">
      <ConfigField label="类型" type="select" v-model="form.healthCheckType"
        :options="[{ label: '禁用', value: '' }, { label: 'TCP', value: 'tcp' }, { label: 'HTTP', value: 'http' }]" :readonly="readonly" tooltip="健康检查类型。TCP=尝试连接端口；HTTP=发送 HTTP 请求检查响应状态。禁用则不检查。" />
      <div></div>
    </div>
    <template v-if="form.healthCheckType">
      <div class="field-row three-col">
        <ConfigField label="超时（秒）" type="number" v-model="form.healthCheckTimeoutSeconds" :min="1" :readonly="readonly" tooltip="单次健康检查的连接超时时间。超过此时长未响应则判定失败。" />
        <ConfigField label="最大失败次数" type="number" v-model="form.healthCheckMaxFailed" :min="1" :readonly="readonly" tooltip="连续失败多少次后将此后端标记为不可用。建议设为 3~5 次。" />
        <ConfigField label="间隔（秒）" type="number" v-model="form.healthCheckIntervalSeconds" :min="1" :readonly="readonly" tooltip="两次健康检查之间的时间间隔。太频繁会增加后端负载。建议 10~30 秒。" />
      </div>
      <template v-if="form.healthCheckType === 'http'">
        <ConfigField label="路径" type="text" v-model="form.healthCheckPath" prop="healthCheckPath" placeholder="/health" :readonly="readonly" tooltip="HTTP 健康检查的请求路径。如 /health、/ping。仅 HTTP 类型有效。" />
        <ConfigField label="HTTP 头" type="kv" v-model="healthCheckHeaders" key-placeholder="Header" value-placeholder="值" :readonly="readonly" tooltip="健康检查请求附加的 HTTP 头。用于需要特定 Header 的后端服务。仅 HTTP 类型有效。" />
      </template>
    </template>
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

const healthCheckHeaders = computed({
  get() {
    return form.value.healthCheckHTTPHeaders.map((h) => ({ key: h.name, value: h.value }))
  },
  set(val: Array<{ key: string; value: string }>) {
    form.value.healthCheckHTTPHeaders = val.map((h) => ({ name: h.key, value: h.value }))
  },
})
</script>

<style scoped lang="scss">
@use '@/assets/css/form-layout';
</style>

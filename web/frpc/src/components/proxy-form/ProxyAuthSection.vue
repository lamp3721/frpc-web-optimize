<template>
  <ConfigSection title="认证" :readonly="readonly">
    <template v-if="['http', 'tcpmux'].includes(form.type)">
      <div class="field-row three-col">
        <ConfigField label="HTTP 用户" type="text" v-model="form.httpUser" :readonly="readonly" tooltip="访问此 HTTP/HTTPS 代理时需要的 Basic Auth 用户名。用户访问时浏览器会弹出登录框。" />
        <ConfigField label="HTTP 密码" type="password" v-model="form.httpPassword" :readonly="readonly" tooltip="访问此 HTTP/HTTPS 代理时需要的 Basic Auth 密码。配合上方用户名使用。" />
        <ConfigField label="按 HTTP 用户路由" type="text" v-model="form.routeByHTTPUser" :readonly="readonly" tooltip="根据认证后的用户名将流量路由到不同后端。格式: user1=backend1,user2=backend2。" />
      </div>
    </template>
    <template v-if="['stcp', 'sudp', 'xtcp'].includes(form.type)">
      <div class="field-row two-col">
        <ConfigField label="密钥" type="password" v-model="form.secretKey" prop="secretKey" :readonly="readonly" tooltip="STCP/SUDP/XTCP 类型代理的预共享密钥。访问者必须提供相同的密钥才能建立连接。" />
        <ConfigField label="允许用户" type="tags" v-model="form.allowUsers" placeholder="username" :readonly="readonly" tooltip="允许访问此 STCP/SUDP/XTCP 代理的访问者用户名列表。留空则允许所有访问者。" />
      </div>
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
</script>

<style scoped lang="scss">
@use '@/assets/css/form-layout';
</style>

<template>
  <ConfigSection title="连接" :readonly="readonly">
    <div class="field-row two-col">
      <ConfigField label="服务端名称" type="text" v-model="form.serverName" prop="serverName"
        placeholder="要访问的代理名称" :readonly="readonly" tooltip="要连接的服务端代理名称（STCP/SUDP/XTCP 类型）。必须与 frps 上已存在的代理名称完全一致。" />
      <ConfigField label="服务端用户" type="text" v-model="form.serverUser"
        placeholder="留空表示相同用户" :readonly="readonly" tooltip="服务端代理所属的用户名。留空表示使用当前登录用户。用于多用户隔离场景。" />
    </div>
    <ConfigField label="密钥" type="password" v-model="form.secretKey"
      placeholder="共享密钥" :readonly="readonly" tooltip="预共享密钥，必须与服务端代理配置的 secretKey 完全一致。用于 STCP/SUDP/XTCP 的端到端加密认证。" />
    <div class="field-row two-col">
      <ConfigField label="绑定地址" type="text" v-model="form.bindAddr"
        placeholder="127.0.0.1" :readonly="readonly" tooltip="访问者本地监听的 IP 地址。127.0.0.1=仅本机访问；0.0.0.0=允许局域网访问。" />
      <ConfigField label="绑定端口" type="number" v-model="form.bindPort"
        :min="bindPortMin" :max="65535" prop="bindPort" :readonly="readonly" tooltip="访问者本地监听的 TCP 端口。本机的应用通过连接此端口来访问远程服务。" />
    </div>
  </ConfigSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { VisitorFormData } from '../../types'
import ConfigSection from '../ConfigSection.vue'
import ConfigField from '../ConfigField.vue'

const props = withDefaults(defineProps<{
  modelValue: VisitorFormData
  readonly?: boolean
}>(), { readonly: false })

const emit = defineEmits<{ 'update:modelValue': [value: VisitorFormData] }>()

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const bindPortMin = computed(() => (form.value.type === 'sudp' ? 1 : undefined))
</script>

<style scoped lang="scss">
@use '@/assets/css/form-layout';
</style>

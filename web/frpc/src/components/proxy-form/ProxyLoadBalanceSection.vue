<template>
  <ConfigSection title="负载均衡" collapsible :readonly="readonly" :has-value="!!form.loadBalancerGroup">
    <div class="field-row two-col">
      <ConfigField label="分组" type="text" v-model="form.loadBalancerGroup" placeholder="分组名称" :readonly="readonly" tooltip="负载均衡分组名。同一分组内的代理会共享连接。留空则不参与负载均衡。" />
      <ConfigField label="分组密钥" type="text" v-model="form.loadBalancerGroupKey" :readonly="readonly" tooltip="负载均衡分组的认证密钥。同一分组的所有代理必须使用相同的密钥。" />
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

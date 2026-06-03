<template>
  <!-- Name / Type / Enabled -->
  <div v-if="!readonly" class="field-row three-col">
    <el-form-item prop="name" class="field-grow">
      <template #label>
        <span class="tip-label">名称<el-tooltip placement="right" content="代理的唯一标识名称，不可重复。所有代理的名称必须全局唯一。" :show-after="200"><el-icon class="tip-ico"><QuestionFilled /></el-icon></el-tooltip></span>
      </template>
      <el-input v-model="form.name" :disabled="editing || readonly" placeholder="my-proxy" />
    </el-form-item>
    <ConfigField
      label="类型"
      type="select"
      v-model="form.type"
      :disabled="editing"
      :options="PROXY_TYPES.map((t) => ({ label: t.toUpperCase(), value: t }))"
      prop="type"
      tooltip="代理类型决定了流量的处理方式。TCP=端口转发、HTTP=七层代理支持域名路由、HTTPS=TLS终端、STCP/XTCP=安全P2P穿透。"
    />
    <el-form-item class="switch-field">
      <template #label>
        <span class="tip-label">启用<el-tooltip placement="right" content="关闭后此代理停止接收流量，但配置保留。等同于删除但不丢失配置。" :show-after="200"><el-icon class="tip-ico"><QuestionFilled /></el-icon></el-tooltip></span>
      </template>
      <el-switch v-model="form.enabled" size="small" />
    </el-form-item>
  </div>
  <div v-else class="field-row three-col">
    <ConfigField label="名称" type="text" :model-value="form.name" readonly class="field-grow" />
    <ConfigField label="类型" type="text" :model-value="form.type.toUpperCase()" readonly tooltip="代理类型：TCP=端口转发、HTTP=七层代理、HTTPS=TLS终端" />
    <ConfigField label="启用" type="switch" :model-value="form.enabled" readonly />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import { PROXY_TYPES, type ProxyFormData } from '../../types'
import ConfigField from '../ConfigField.vue'

const props = withDefaults(defineProps<{
  modelValue: ProxyFormData
  readonly?: boolean
  editing?: boolean
}>(), { readonly: false, editing: false })

const emit = defineEmits<{ 'update:modelValue': [value: ProxyFormData] }>()

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<style scoped lang="scss">
@use '@/assets/css/form-layout';

.tip-label {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.tip-ico {
  font-size: 12px;
  color: var(--color-text-light);
  cursor: help;
  &:hover { color: var(--color-text-secondary); }
}
</style>

<template>
  <div class="proxy-edit-page">
    <!-- Header with breadcrumb and actions -->
    <div class="edit-header">
      <nav class="breadcrumb">
        <router-link to="/proxies?tab=store" class="breadcrumb-item">代理</router-link>
        <span class="breadcrumb-separator">&rsaquo;</span>
        <span class="breadcrumb-current">{{ isEditing ? '编辑代理' : '新建代理' }}</span>
      </nav>
      <div class="header-actions">
        <ActionButton variant="outline" size="small" @click="goBack">取消</ActionButton>
        <ActionButton size="small" :loading="saving" @click="handleSave">
          {{ isEditing ? '更新' : '创建' }}
        </ActionButton>
      </div>
    </div>

    <div v-loading="pageLoading" class="edit-content">
      <!-- 场景模板（仅新建时显示） -->
      <div v-if="!isEditing && !pageLoading" class="template-row">
        <span class="template-row-label">从模板开始</span>
        <div class="template-chips">
          <button
            v-for="t in PROXY_TEMPLATES"
            :key="t.id"
            type="button"
            class="template-chip"
            :class="{ 'template-chip-active': appliedTemplate === t.id }"
            :title="t.desc"
            @click="applyTemplate(t)"
          >
            {{ t.title }}
          </button>
        </div>
      </div>
      <div v-if="!isEditing && appliedTemplateDesc" class="template-desc">{{ appliedTemplateDesc }}</div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent
      >
        <ProxyFormLayout v-model="form" :editing="isEditing" />
      </el-form>
    </div>

    <ConfirmDialog
      v-model="leaveDialogVisible"
      title="未保存的更改"
      message="您有未保存的更改。确定要离开吗？"
      :is-mobile="isMobile"
      @confirm="handleLeaveConfirm"
      @cancel="handleLeaveCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  type ProxyFormData,
  createDefaultProxyForm,
  formToStoreProxy,
  storeProxyToForm,
} from '../types'
import { getStoreProxy } from '../api/frpc'
import { useProxyStore } from '../stores/proxy'
import ActionButton from '@shared/components/ActionButton.vue'
import ConfirmDialog from '@shared/components/ConfirmDialog.vue'
import ProxyFormLayout from '../components/proxy-form/ProxyFormLayout.vue'
import { useResponsive } from '../composables/useResponsive'

// ===== 场景模板（新建时代填常见配置） =====
interface ProxyTemplate {
  id: string
  title: string
  desc: string
  patch: Partial<ProxyFormData>
}

const PROXY_TEMPLATES: ProxyTemplate[] = [
  {
    id: 'https-terminate',
    title: 'HTTPS 终止转发',
    desc: 'frps:443 按 SNI 透传 → frpc 本地证书终止 TLS → 明文 HTTP 到 127.0.0.1:80。下游 NPM 无需证书，真实客户端 IP 通过 X-Forwarded-For 自动传递。',
    patch: {
      type: 'https',
      pluginType: 'https2http',
      pluginConfig: { localAddr: '127.0.0.1:80', enableHTTP2: true },
    },
  },
  {
    id: 'http-site',
    title: 'HTTP 网站',
    desc: 'frps vhostHTTPPort → 本地 80，按域名分流，适合纯 HTTP 站点或上游已有 TLS。',
    patch: { type: 'http', localPort: 80 },
  },
  {
    id: 'ssh',
    title: 'SSH 远程',
    desc: 'frps 端口 6022 → 本地 22，从外网 SSH 回内网机器。',
    patch: { type: 'tcp', localPort: 22, remotePort: 6022 },
  },
  {
    id: 'sni-passthrough',
    title: 'HTTPS SNI 直通',
    desc: '443 加密流量透传到本地 443，证书由下游（如 NPM）提供。',
    patch: { type: 'https', localPort: 443 },
  },
]

const appliedTemplate = ref('')
const appliedTemplateDesc = computed(
  () => PROXY_TEMPLATES.find((t) => t.id === appliedTemplate.value)?.desc || '',
)

const applyTemplate = (tpl: ProxyTemplate) => {
  appliedTemplate.value = tpl.id
  const next = {
    ...createDefaultProxyForm(),
    ...tpl.patch,
    // 保留用户已填的名称与启用状态
    name: form.value.name,
    enabled: form.value.enabled,
  }
  form.value = next
  // 同步 prevType，避免类型变化 watcher 清空模板带入的类型专属字段
  prevType = next.type
  nextTick(() => { prevType = next.type })
}

const { isMobile } = useResponsive()
const route = useRoute()
const router = useRouter()
const proxyStore = useProxyStore()

const isEditing = computed(() => !!route.params.name)
const pageLoading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = ref<ProxyFormData>(createDefaultProxyForm())
const dirty = ref(false)
const formSaved = ref(false)
const trackChanges = ref(false)

const rules: FormRules = {
  name: [
    { required: true, message: '名称为必填项', trigger: 'blur' },
    { min: 1, max: 50, message: '长度应为 1 到 50', trigger: 'blur' },
  ],
  type: [{ required: true, message: '类型为必填项', trigger: 'change' }],
  localPort: [
    {
      validator: (_rule, value, callback) => {
        if (!form.value.pluginType && value == null) {
          callback(new Error('本地端口为必填项'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  customDomains: [
    {
      validator: (_rule, value, callback) => {
        if (
          ['http', 'https', 'tcpmux'].includes(form.value.type) &&
          (!value || value.length === 0) &&
          !form.value.subdomain
        ) {
          callback(new Error('需要自定义域名或子域名'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  healthCheckPath: [
    {
      validator: (_rule, value, callback) => {
        if (form.value.healthCheckType === 'http' && !value) {
          callback(new Error('HTTP 健康检查需要路径'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

const goBack = () => {
  router.back()
}

watch(
  () => form.value,
  () => {
    if (trackChanges.value) {
      dirty.value = true
    }
  },
  { deep: true },
)

const leaveDialogVisible = ref(false)
const leaveResolve = ref<((value: boolean) => void) | null>(null)

onBeforeRouteLeave(async () => {
  if (dirty.value && !formSaved.value) {
    leaveDialogVisible.value = true
    return new Promise<boolean>((resolve) => {
      leaveResolve.value = resolve
    })
  }
})

const handleLeaveConfirm = () => {
  leaveDialogVisible.value = false
  leaveResolve.value?.(true)
}

const handleLeaveCancel = () => {
  leaveDialogVisible.value = false
  leaveResolve.value?.(false)
}

const loadProxy = async () => {
  const name = route.params.name as string
  if (!name) return

  trackChanges.value = false
  dirty.value = false
  pageLoading.value = true
  try {
    const res = await getStoreProxy(name)
    form.value = storeProxyToForm(res)
    await nextTick()
  } catch (err: any) {
    ElMessage.error('加载代理失败：' + err.message)
    router.push('/proxies?tab=store')
  } finally {
    pageLoading.value = false
    nextTick(() => {
      prevType = form.value.type
      trackChanges.value = true
    })
  }
}

const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请修正表单错误')
    return
  }

  saving.value = true
  try {
    const data = formToStoreProxy(form.value)
    if (isEditing.value) {
      await proxyStore.updateProxy(form.value.name, data)
      ElMessage.success('代理已更新')
    } else {
      await proxyStore.createProxy(data)
      ElMessage.success('代理已创建')
    }
    formSaved.value = true
    router.push('/proxies?tab=store')
  } catch (err: any) {
    ElMessage.error('操作失败：' + (err.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEditing.value) {
    loadProxy()
  } else {
    trackChanges.value = true
  }
})

watch(
  () => route.params.name,
  (name, oldName) => {
    if (name === oldName) return
    if (name) {
      loadProxy()
      return
    }
    trackChanges.value = false
    form.value = createDefaultProxyForm()
    dirty.value = false
    appliedTemplate.value = ''
    prevType = form.value.type
    nextTick(() => {
      trackChanges.value = true
    })
  },
)

let prevType = form.value.type
watch(
  () => form.value.type,
  (newType) => {
    if (!trackChanges.value) {
      prevType = newType
      return
    }
    if (newType === prevType) return
    prevType = newType
    const f = form.value

    // Reset all type-specific fields
    f.remotePort = undefined
    f.customDomains = []
    f.subdomain = ''
    f.locations = []
    f.httpUser = ''
    f.httpPassword = ''
    f.hostHeaderRewrite = ''
    f.requestHeaders = []
    f.responseHeaders = []
    f.routeByHTTPUser = ''
    f.multiplexer = 'httpconnect'
    f.secretKey = ''
    f.allowUsers = []
    f.natTraversalDisableAssistedAddrs = false
  },
)
</script>

<style scoped lang="scss">
.proxy-edit-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 960px;
  margin: 0 auto;
}

/* Edit Header */
.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: $spacing-xl 24px;
}

.edit-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 160px;
}

/* 场景模板 */
.template-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.template-row-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.template-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-chip {
  padding: 6px 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 16px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-chip:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.template-chip-active,
.template-chip-active:hover {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: var(--el-color-primary-contrast, #fff);
}

.template-desc {
  margin-bottom: 16px;
  padding: 10px 14px;
  border-radius: 6px;
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  gap: $spacing-sm;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.breadcrumb-item {
  color: $color-text-secondary;
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-item:hover {
  color: var(--el-color-primary);
}

.breadcrumb-separator {
  color: var(--el-border-color);
}

.breadcrumb-current {
  color: $color-text-primary;
  font-weight: 500;
}

/* Responsive */
@include mobile {
  .edit-header {
    padding: $spacing-lg;
  }

  .edit-content {
    padding: 0 $spacing-lg 160px;
  }
}
</style>

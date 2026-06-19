<template>
  <div id="app">
    <header class="header">
      <div class="header-content">
        <div class="brand-section">
          <button v-if="isMobile" class="hamburger-btn" @click="toggleSidebar" aria-label="切换菜单">
            <span class="hamburger-icon">&#9776;</span>
          </button>
          <div class="logo-wrapper">
            <LogoIcon class="logo-icon" />
          </div>
          <span class="divider">/</span>
          <span class="brand-name">frp</span>
          <span class="badge">客户端</span>
        </div>

        <div class="header-controls">
          <button
            class="connection-btn"
            :class="{ connected: connStore.connected }"
            @click="connDialogVisible = true"
            :title="connStore.connected ? connStore.baseUrl : '配置连接'"
          >
            <span class="conn-dot" :class="{ active: connStore.connected }" />
            <span class="conn-text">{{
              connStore.connected ? connStore.host : '连接'
            }}</span>
          </button>
          <a
            class="github-link"
            href="https://github.com/fatedier/frp"
            target="_blank"
            aria-label="GitHub"
          >
            <GitHubIcon class="github-icon" />
          </a>
          <el-switch
            v-model="isDark"
            inline-prompt
            :active-icon="Moon"
            :inactive-icon="Sunny"
            class="theme-switch"
          />
        </div>
      </div>
    </header>

    <div class="layout">
      <!-- Mobile overlay -->
      <div
        v-if="isMobile && sidebarOpen"
        class="sidebar-overlay"
        @click="closeSidebar"
      />

      <aside class="sidebar" :class="{ 'mobile-open': isMobile && sidebarOpen }">
        <nav class="sidebar-nav">
          <router-link
            to="/proxies"
            class="sidebar-link"
            :class="{ active: route.path.startsWith('/proxies') }"
            @click="closeSidebar"
          >
            代理
          </router-link>
          <router-link
            to="/visitors"
            class="sidebar-link"
            :class="{ active: route.path.startsWith('/visitors') }"
            @click="closeSidebar"
          >
            访问者
          </router-link>
          <router-link
            to="/config"
            class="sidebar-link"
            :class="{ active: route.path === '/config' }"
            @click="closeSidebar"
          >
            配置
          </router-link>
        </nav>
      </aside>

      <main id="content">
        <router-view></router-view>
      </main>
    </div>

    <el-dialog
      v-model="connDialogVisible"
      title="连接设置"
      width="420px"
    >
      <el-form label-position="top">
        <el-form-item>
          <template #label>
            <span class="conn-label">
              协议
              <el-tooltip placement="right" content="连接 frp 管理 API 时使用的协议。如果 frps 配置了 TLS 证书则选 HTTPS，否则选 HTTP。" :show-after="200">
                <el-icon class="conn-tip-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-select v-model="connStore.protocol" style="width: 100%">
            <el-option label="HTTP" value="http" />
            <el-option label="HTTPS" value="https" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <template #label>
            <span class="conn-label">
              主机 / IP
              <el-tooltip placement="right" content="frps 管理面板所在服务器的地址。可以是 IP 或域名。例如你部署 frpc 的服务器 IP，或 frps 的公网域名。" :show-after="200">
                <el-icon class="conn-tip-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input
            v-model="connStore.host"
            placeholder="例如 192.168.1.100 或 frpc.example.com"
          />
        </el-form-item>
        <el-form-item>
          <template #label>
            <span class="conn-label">
              端口
              <el-tooltip placement="right" content="frps 管理面板的端口。对应 frps.toml 中 webServer.port 的值，默认 7400。如果使用反向代理（nginx）则填代理端口。" :show-after="200">
                <el-icon class="conn-tip-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="connStore.port" placeholder="例如 7400" />
        </el-form-item>

        <el-divider content-position="left">
          <span class="conn-auth-title">认证（可选）</span>
        </el-divider>

        <el-form-item>
          <template #label>
            <span class="conn-label">
              用户名
              <el-tooltip placement="right" content="frps 管理面板的 Basic Auth 用户名。对应 frps.toml 中 webServer.user 的值，默认 admin。如果未设置认证则留空。" :show-after="200">
                <el-icon class="conn-tip-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="connStore.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item>
          <template #label>
            <span class="conn-label">
              密码
              <el-tooltip placement="right" content="frps 管理面板的 Basic Auth 密码。对应 frps.toml 中 webServer.password 的值。如果未设置认证则留空。" :show-after="200">
                <el-icon class="conn-tip-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="connStore.password" type="password" show-password placeholder="密码" />
        </el-form-item>

        <div v-if="connStore.baseUrl" class="conn-preview">
          <span class="conn-preview-label">预览</span>
          <code class="conn-preview-url">{{ connStore.baseUrl }}</code>
        </div>

        <div class="conn-test-section">
          <el-button
            :disabled="!connStore.host"
            :loading="testLoading"
            @click="handleTestConnection"
          >
            测试连接
          </el-button>
          <span v-if="testResult === 'success'" class="conn-test-msg success">
            已连接
          </span>
          <span v-else-if="testResult === 'auth'" class="conn-test-msg auth">
            {{ testMsg }}
          </span>
          <span v-else-if="testResult === 'fail'" class="conn-test-msg fail">
            {{ testMsg }}
          </span>
        </div>
      </el-form>

      <template #footer>
        <el-button
          v-if="connStore.connected"
          @click="handleDisconnect"
          type="danger"
          plain
        >
          断开连接
        </el-button>
        <el-button @click="connDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveConnection">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDark } from '@vueuse/core'
import { Moon, Sunny, QuestionFilled } from '@element-plus/icons-vue'
import GitHubIcon from './assets/icons/github.svg?component'
import LogoIcon from './assets/icons/logo.svg?component'
import { useResponsive } from './composables/useResponsive'
import { useConnectionStore } from './stores/connection'

const route = useRoute()
const isDark = useDark()
const { isMobile } = useResponsive()
const connStore = useConnectionStore()

const sidebarOpen = ref(false)
const connDialogVisible = ref(false)
const testLoading = ref(false)
const testResult = ref<'success' | 'auth' | 'fail' | null>(null)
const testMsg = ref('')

const handleDisconnect = () => {
  connStore.disconnect()
  testResult.value = null
  testMsg.value = ''
  connDialogVisible.value = false
}

const handleSaveConnection = () => {
  connStore.save()
  connStore.syncProxyTarget()
  testResult.value = null
  testMsg.value = ''
  connDialogVisible.value = false
}

const handleTestConnection = async () => {
  testLoading.value = true
  testResult.value = null
  testMsg.value = ''

  const headers: Record<string, string> = {}
  if (connStore.authHeader) {
    headers['Authorization'] = connStore.authHeader
  }
  if (connStore.baseUrl) {
    headers['X-Frpc-Target'] = connStore.baseUrl
  }

  try {
    const res = await fetch('/api/status', {
      signal: AbortSignal.timeout(5000),
      headers,
    })
    if (res.status === 401 || res.status === 403) {
      testResult.value = 'auth'
      testMsg.value = '可达（需要认证）'
    } else if (!res.ok) {
      testResult.value = 'fail'
      testMsg.value = `HTTP ${res.status}`
    } else {
      testResult.value = 'success'
    }
  } catch (err: any) {
    testResult.value = 'fail'
    testMsg.value = err.name === 'TimeoutError'
      ? '连接超时'
      : (err.message || '连接失败')
  } finally {
    testLoading.value = false
  }
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

// Auto-close sidebar on route change
watch(() => route.path, () => {
  if (isMobile.value) {
    closeSidebar()
  }
})

// Auto-open connection dialog on first visit if not configured
onMounted(() => {
  if (!connStore.connected) {
    connDialogVisible.value = true
  }
})
</script>

<style lang="scss">
body {
  margin: 0;
  font-family: ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica,
    Arial, sans-serif;
}

*,
:after,
:before {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html, body {
  height: 100%;
  overflow: hidden;
}

#app {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: $color-bg-secondary;
}

// Header
.header {
  flex-shrink: 0;
  background: $color-bg-primary;
  border-bottom: 1px solid $color-border-light;
  height: $header-height;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 $spacing-xl;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.logo-wrapper {
  display: flex;
  align-items: center;
}

.logo-icon {
  width: 28px;
  height: 28px;
}

.divider {
  color: $color-border;
  font-size: 22px;
  font-weight: 200;
}

.brand-name {
  font-weight: $font-weight-semibold;
  font-size: $font-size-xl;
  color: $color-text-primary;
  letter-spacing: -0.5px;
}

.badge {
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: $color-text-muted;
  background: $color-bg-muted;
  padding: 2px 8px;
  border-radius: 4px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.connection-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid $color-border-light;
  border-radius: $radius-sm;
  background: $color-bg-primary;
  color: $color-text-muted;
  font-size: $font-size-sm;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $color-bg-hover;
    color: $color-text-primary;
    border-color: $color-border;
  }

  &.connected {
    color: $color-text-primary;
    border-color: $color-text-light;
  }
}

.conn-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: $color-text-light;
  flex-shrink: 0;

  &.active {
    background: #67c23a;
  }
}

.conn-text {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conn-preview {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: 10px 12px;
  background: $color-bg-hover;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  margin-top: $spacing-sm;
}

.conn-preview-label {
  color: $color-text-muted;
  flex-shrink: 0;
}

.conn-preview-url {
  color: $color-text-primary;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: $font-size-sm;
  word-break: break-all;
}

.conn-test-section {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-top: $spacing-sm;
}

.conn-test-msg {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;

  &.success {
    color: #67c23a;
  }

  &.auth {
    color: #e6a23c;
  }

  &.fail {
    color: #f56c6c;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.conn-auth-title {
  font-size: $font-size-sm;
  color: $color-text-muted;
}

.conn-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.conn-tip-icon {
  font-size: 13px;
  color: $color-text-light;
  cursor: help;
  &:hover { color: $color-text-secondary; }
}

.github-link {
  @include flex-center;
  width: 28px;
  height: 28px;
  border-radius: $radius-sm;
  color: $color-text-secondary;
  transition: all $transition-fast;

  &:hover {
    background: $color-bg-hover;
    color: $color-text-primary;
  }
}

.github-icon {
  width: 18px;
  height: 18px;
}

.theme-switch {
  --el-switch-on-color: #2c2c3a;
  --el-switch-off-color: #f2f2f2;
  --el-switch-border-color: var(--color-border-light);
}

html.dark .theme-switch {
  --el-switch-off-color: #333;
}

.theme-switch .el-switch__core .el-switch__inner .el-icon {
  color: #909399 !important;
}

// Layout
.layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: $sidebar-width;
  flex-shrink: 0;
  border-right: 1px solid $color-border-light;
  padding: $spacing-lg $spacing-md;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-nav {
  @include flex-column;
  gap: 2px;
}

.sidebar-link {
  display: block;
  text-decoration: none;
  font-size: $font-size-lg;
  color: $color-text-secondary;
  padding: 10px $spacing-md;
  border-radius: $radius-sm;
  transition: all $transition-fast;

  &:hover {
    color: $color-text-primary;
    background: $color-bg-hover;
  }

  &.active {
    color: $color-text-primary;
    background: $color-bg-hover;
    font-weight: $font-weight-medium;
  }
}

// Hamburger button (mobile only)
.hamburger-btn {
  @include flex-center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: background $transition-fast;

  &:hover {
    background: $color-bg-hover;
  }
}

.hamburger-icon {
  font-size: 20px;
  line-height: 1;
  color: $color-text-primary;
}

// Mobile overlay
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

#content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  background: $color-bg-primary;
}

// Common page styles
.page-title {
  font-size: $font-size-xl + 2px;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  margin: 0;
}

.page-subtitle {
  font-size: $font-size-md;
  color: $color-text-muted;
  margin: $spacing-sm 0 0;
}

.icon-btn {
  @include flex-center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: $color-text-muted;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $color-bg-hover;
    color: $color-text-primary;
  }
}

.search-input {
  width: 200px;

  .el-input__wrapper {
    border-radius: 10px;
    background: $color-bg-tertiary;
    box-shadow: 0 0 0 1px $color-border inset;

    &.is-focus {
      box-shadow: 0 0 0 1px $color-text-light inset;
    }
  }

  .el-input__inner {
    color: $color-text-primary;
  }

  .el-input__prefix {
    color: $color-text-muted;
  }

  @include mobile {
    flex: 1;
    width: auto;
  }
}

// Element Plus global overrides
.el-button {
  font-weight: $font-weight-medium;
}

.el-tag {
  font-weight: $font-weight-medium;
}

.el-switch {
  --el-switch-on-color: #606266;
  --el-switch-off-color: #dcdfe6;
}

html.dark .el-switch {
  --el-switch-on-color: #b0b0b0;
  --el-switch-off-color: #404040;
}

.el-radio {
  --el-radio-text-color: var(--color-text-primary) !important;
  --el-radio-input-border-color-hover: #606266 !important;
  --el-color-primary: #606266 !important;
}

.el-form-item {
  margin-bottom: 16px;
}

.el-loading-mask {
  border-radius: $radius-md;
}

// Select overrides
.el-select__wrapper {
  border-radius: $radius-md !important;
  box-shadow: 0 0 0 1px $color-border-light inset !important;
  transition: all $transition-fast;

  &:hover {
    box-shadow: 0 0 0 1px $color-border inset !important;
  }

  &.is-focused {
    box-shadow: 0 0 0 1px $color-border inset !important;
  }
}

.el-select-dropdown {
  border-radius: 12px !important;
  border: 1px solid $color-border-light !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
              0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  padding: 4px !important;
}

.el-select-dropdown__item {
  border-radius: $radius-sm;
  margin: 2px 0;
  transition: background $transition-fast;

  &.is-selected {
    color: $color-text-primary;
    font-weight: $font-weight-medium;
  }
}

// Input overrides
.el-input__wrapper {
  border-radius: $radius-md !important;
  box-shadow: 0 0 0 1px $color-border-light inset !important;
  transition: all $transition-fast;

  &:hover {
    box-shadow: 0 0 0 1px $color-border inset !important;
  }

  &.is-focus {
    box-shadow: 0 0 0 1px $color-border inset !important;
  }
}

// Status pill (shared)
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  padding: 3px 10px;
  border-radius: 10px;
  text-transform: capitalize;

  &.running {
    background: rgba(103, 194, 58, 0.1);
    color: #67c23a;
  }

  &.error {
    background: rgba(245, 108, 108, 0.1);
    color: #f56c6c;
  }

  &.waiting {
    background: rgba(230, 162, 60, 0.1);
    color: #e6a23c;
  }

  &.disabled {
    background: $color-bg-muted;
    color: $color-text-light;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
}

// Mobile
@include mobile {
  .header-content {
    padding: 0 $spacing-lg;
  }

  .sidebar {
    position: fixed;
    top: $header-height;
    left: 0;
    bottom: 0;
    z-index: 100;
    background: $color-bg-primary;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border-right: 1px solid $color-border-light;

    &.mobile-open {
      transform: translateX(0);
    }
  }

  .sidebar-nav {
    flex-direction: column;
    gap: 2px;
  }

  #content {
    width: 100%;
    overflow-y: auto;
  }

  // Select dropdown overflow prevention
  .el-select-dropdown {
    max-width: calc(100vw - 32px);
  }
}
</style>

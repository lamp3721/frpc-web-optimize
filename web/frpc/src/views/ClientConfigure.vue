<template>
  <div class="configure-page">
    <div class="page-header">
      <div class="title-row">
        <h1 class="page-title">配置</h1>
      </div>
      <div class="header-actions">
        <a href="https://github.com/fatedier/frp#configuration-files" target="_blank" class="docs-link">
          <el-icon><Link /></el-icon>文档
        </a>
        <ActionButton @click="handleUpload">更新并重载</ActionButton>
      </div>
    </div>

    <div class="split-layout" v-loading="pageLoading">
      <div class="form-main">
        <div class="form-panel">
        <!-- 连接模式选择 -->
        <div class="form-section mode-selector-section">
          <h3 class="section-title">连接模式</h3>
          <div class="conn-mode-cards">
            <div
              v-for="m in connModes"
              :key="m.id"
              class="conn-mode-card"
              :class="{ active: connMode === m.id }"
              @click="selectMode(m.id)"
            >
              <div class="mode-name">{{ m.label }}</div>
              <div class="mode-desc">{{ m.desc }}</div>
              <el-tooltip placement="bottom" :content="m.tooltip" :show-after="0">
                <el-icon class="mode-tip-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </div>
        </div>

        <!-- Sub-tabs -->
        <div class="sub-tabs">
          <button class="sub-tab-btn" :class="{ active: activeTab === 'connect' }" @click="activeTab = 'connect'">连接配置</button>
          <button class="sub-tab-btn" :class="{ active: activeTab === 'proxy' }" @click="activeTab = 'proxy'">
            代理（{{ detectedProxies.length }}）
          </button>
        </div>

        <template v-if="activeTab === 'connect'">
        <!-- 基本连接 -->
        <div class="form-section">
          <h3 class="section-title">基本连接</h3>
          <div class="form-grid">
            <el-form-item :class="{ 'field-key': isKeyField('serverAddr') }">
              <template #label>
                <span class="label-with-tip">服务端地址<el-tooltip placement="auto" :content="tips.serverAddr" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span>
              </template>
              <el-input v-model="form.serverAddr" placeholder="必填，frps 地址" @input="onFormChange" />
            </el-form-item>
          </div>
        </div>

        <!-- 认证 -->
        <div class="form-section">
          <h3 class="section-title">认证</h3>
          <div class="form-grid">
            <el-form-item :class="{ 'field-key': isKeyField('authToken') }">
              <template #label>                <span class="label-with-tip">认证令牌<el-tooltip placement="auto" :content="tips.authToken" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
              <el-input v-model="form.authToken" placeholder="必填，与服务端一致" @input="onFormChange" />
            </el-form-item>
          </div>
        </div>

        <!-- 传输层 -->
        <div class="form-section">
          <h3 class="section-title">传输</h3>
          <div class="form-grid">
            <el-form-item v-if="connMode === 'quic'">
              <template #label><span class="label-with-tip">协议<el-tooltip placement="auto" :content="tips.protocol" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span>
              </template>
              <el-input value="quic" disabled />
            </el-form-item>
            <el-form-item v-if="connMode !== 'quic'" :class="{ 'field-key': isKeyField('tcpMux') }">
              <template #label>                <span class="label-with-tip">TCP Mux<el-tooltip placement="auto" :content="tips.tcpMux" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
              <el-switch
                v-model="form.tcpMux"
                :disabled="connMode === 'tcpMux' || connMode === 'tcpNoMux'"
                @change="onFormChange"
              />
              <span class="field-hint">
                <template v-if="connMode === 'tcpMux'">★ 多路复用模式，强制开启</template>
                <template v-else-if="connMode === 'tcpNoMux'">★ 直连模式，强制关闭</template>
                <template v-else>{{ form.tcpMux ? '开启多路复用' : '关闭多路复用' }}</template>
              </span>
            </el-form-item>
            <el-form-item
              v-if="connMode === 'tcpNoMux' || (!form.tcpMux && connMode !== 'tcpMux')"
              :class="{ 'field-key': isKeyField('dialServerKeepalive') }"
            >
              <template #label>                <span class="label-with-tip">TCP 保活间隔<el-tooltip placement="auto" :content="tips.tcpKeepalive" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
              <el-input v-model="form.dialServerKeepalive" placeholder="秒，默认 7200 需调小" @input="onFormChange" />
            </el-form-item>
            <el-form-item v-if="connMode === 'tcpNoMux'" :class="{ 'field-key': isKeyField('poolCount') }">
              <template #label>                <span class="label-with-tip">连接池大小<el-tooltip placement="auto" :content="tips.poolCount" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
              <el-input v-model="form.poolCount" :placeholder="poolCountHint" @input="onFormChange" />
            </el-form-item>

          </div>
        </div>
        </template>

        <template v-if="activeTab === 'proxy'">
        <!-- 代理列表 -->
        <div class="form-section">
          <div class="section-title-row">
            <h3 class="section-title">代理（已识别 {{ detectedProxies.length }} 个）</h3>
            <el-button size="small" class="add-proxy-btn" @click="openProxyDialog">+ 添加代理</el-button>
          </div>
          <div v-if="detectedProxies.length === 0" class="proxy-empty">暂无代理配置。点击上方按钮添加。</div>
          <div v-else class="proxy-list">
            <div
              v-for="(p, i) in detectedProxies"
              :key="i"
              class="proxy-card"
              :class="[proxyCardClass(p.type), { 'drag-over': dragOverIndex === i }]"
              draggable="true"
              @click="editProxy(i)"
              @dragstart="onDragStart(i, $event)"
              @dragover.prevent="onDragOver(i)"
              @dragleave="onDragLeave"
              @drop.prevent="onDrop(i)"
            >
              <div class="proxy-card-body">
                <span class="drag-handle" @mousedown.stop>⋮⋮</span>
                <div class="proxy-card-info">
                  <span class="proxy-card-name">{{ p.name }}</span>
                  <el-tag size="small" :type="tagType(p.type)" class="proxy-type-tag">{{ p.type.toUpperCase() }}</el-tag>
                  <el-tag v-if="p.remotePort != null" size="small" type="warning" class="proxy-port-tag">:{{ p.remotePort }}</el-tag>
                  <span class="proxy-card-detail">{{ proxySummary(p) }}</span>
                </div>
                <div class="proxy-card-actions">
                  <el-button size="small" text class="proxy-action-btn" @click.stop="editProxy(i)"><el-icon><Edit /></el-icon></el-button>
                  <el-button size="small" text class="proxy-action-btn proxy-action-delete" @click.stop="removeProxy(i)"><el-icon><Delete /></el-icon></el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </template>
      </div>
      </div>

      <!-- Optional config panel (right side) -->
      <div class="optional-panel" v-if="showOptional">
        <div class="optional-panel-header">
          <h3 class="section-title">可选配置</h3>
        </div>
        <div v-if="mismatchedFields.length" class="mismatch-warn">
          <span class="mismatch-title">⚠ 当前模式无效的配置</span>
          <div v-for="m in mismatchedFields" :key="m.key" class="mismatch-item">
            <code>{{ m.key }}</code>{{ m.note ? ' — ' + m.note : '' }}
          </div>
        </div>
        <div class="optional-body">
          <div class="opt-group">
            <div class="opt-group-header">
              <el-icon class="opt-group-icon"><Connection /></el-icon>
              <span class="opt-group-title">服务端端口</span>
              <span class="opt-default">默认 7000</span>
            </div>
            <div class="form-grid">
              <el-form-item>
                <template #label><span class="opt-label">端口<el-tooltip placement="auto" :content="tips.serverPort" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.serverPort" placeholder="默认 7000" @input="onFormChange" />
              </el-form-item>
            </div>
          </div>

          <template v-if="connMode === 'tcpMux'">
            <div class="opt-group">
              <div class="opt-group-header">
                <el-icon class="opt-group-icon"><Setting /></el-icon>
                <span class="opt-group-title">高级传输</span>
              </div>
              <div class="form-grid">
                <el-form-item>
                  <template #label><span class="opt-label">保活间隔<span class="opt-default">默认 30s</span><el-tooltip placement="auto" :content="tips.tcpMuxKeepaliveInterval" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.tcpMuxKeepaliveInterval" placeholder="秒，默认 30" @input="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">TCP 保活<span class="opt-default">默认 7200s</span><el-tooltip placement="auto" :content="tips.tcpKeepalive" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.dialServerKeepalive" placeholder="秒，默认 7200" @input="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">拨号超时<span class="opt-default">默认 10s</span><el-tooltip placement="auto" :content="tips.dialServerTimeout" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.dialServerTimeout" placeholder="秒，默认 10" @input="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">协议版本<span class="opt-default">默认 v1</span><el-tooltip placement="auto" :content="tips.wireProtocol" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-select v-model="form.wireProtocol" @change="onFormChange">
                    <el-option label="v1（默认）" value="" />
                    <el-option label="v1" value="v1" />
                    <el-option label="v2" value="v2" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">连接池大小<span class="opt-default">默认 1</span><el-tooltip placement="auto" :content="tips.poolCount" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.poolCount" placeholder="默认 1" @input="onFormChange" />
                </el-form-item>
              </div>
            </div>
          </template>

          <template v-if="connMode === 'tcpNoMux'">
            <div class="opt-group">
              <div class="opt-group-header">
                <el-icon class="opt-group-icon"><Setting /></el-icon>
                <span class="opt-group-title">高级传输</span>
              </div>
              <div class="form-grid">
                <el-form-item>
                  <template #label><span class="opt-label">拨号超时<span class="opt-default">默认 10s</span><el-tooltip placement="auto" :content="tips.dialServerTimeout" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.dialServerTimeout" placeholder="秒，默认 10" @input="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">心跳间隔<span class="opt-default">默认 30s</span><el-tooltip content='应用层 Ping 间隔（秒）。本模式下默认 30，自动生效。仅作用于控制连接。' placement="auto" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.heartbeatInterval" placeholder="秒，默认 30" @input="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">心跳超时<span class="opt-default">默认 90s</span><el-tooltip content='应用层 Pong 超时（秒）。默认 90。超过未收到 Pong 判定控制连接断开。' placement="auto" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.heartbeatTimeout" placeholder="秒，默认 90" @input="onFormChange" />
                </el-form-item>
              </div>
            </div>
          </template>

          <template v-if="connMode === 'quic'">
            <div class="opt-group">
              <div class="opt-group-header">
                <el-icon class="opt-group-icon"><Setting /></el-icon>
                <span class="opt-group-title">QUIC 协议选项</span>
              </div>
              <div class="form-grid">
                <el-form-item>
                  <template #label><span class="opt-label">保活间隔<span class="opt-default">默认 10s</span><el-tooltip placement="auto" :content="tips.quicKeepalivePeriod" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.quicKeepalivePeriod" placeholder="秒，默认 10" @input="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">空闲超时<span class="opt-default">默认 30s</span><el-tooltip placement="auto" :content="tips.quicMaxIdleTimeout" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.quicMaxIdleTimeout" placeholder="秒，默认 30" @input="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">最大并发流<span class="opt-default">默认 100000</span><el-tooltip placement="auto" :content="tips.quicMaxIncomingStreams" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.quicMaxIncomingStreams" placeholder="默认 100000" @input="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">连接池大小<span class="opt-default">默认 1，QUIC 建议 3</span><el-tooltip placement="auto" :content="tips.poolCount" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.poolCount" placeholder="默认 1，QUIC 建议 3" @input="onFormChange" />
                </el-form-item>
              </div>
            </div>
          </template>

          <div class="opt-group">
            <div class="opt-group-header">
              <el-icon class="opt-group-icon"><Lock /></el-icon>
              <span class="opt-group-title">TLS</span>
            </div>
            <div class="form-grid">
              <el-form-item>
                <template #label><span class="opt-label">启用 TLS<span class="opt-default">默认 true</span><el-tooltip placement="auto" :content="tips.tlsEnable" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-switch v-model="form.tlsEnable" :disabled="connMode === 'quic'" @change="onFormChange" />
              </el-form-item>
              <el-form-item v-if="form.tlsEnable || connMode === 'quic'">
                <template #label><span class="opt-label">禁用自定义首字节<span class="opt-default">默认 true</span><el-tooltip placement="auto" :content="tips.disableCustomTLSFirstByte" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-switch v-model="form.tlsDisableCustomFirstByte" @change="onFormChange" />
              </el-form-item>
                <template v-if="form.tlsEnable || connMode === 'quic'">
                  <p class="opt-hint">证书和密钥仅 mTLS 双向认证时需要，普通场景留空即可</p>
                  <el-form-item>
                  <template #label><span class="opt-label">证书文件<el-tooltip placement="auto" :content="tips.tlsCertFile" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.tlsCertFile" placeholder="client.crt" @input="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">密钥文件<el-tooltip placement="auto" :content="tips.tlsKeyFile" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.tlsKeyFile" placeholder="client.key" @input="onFormChange" />
                </el-form-item>
                <el-form-item v-if="connMode === 'quic'">
                  <template #label><span class="opt-label">TLS SNI<el-tooltip placement="auto" :content="tips.tlsServerName" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.tlsServerName" placeholder="留空=serverAddr" @input="onFormChange" />
                </el-form-item>
              </template>
            </div>
          </div>

          <div class="opt-group">
            <div class="opt-group-header">
              <el-icon class="opt-group-icon"><User /></el-icon>
              <span class="opt-group-title">管理面板</span>
            </div>
            <div class="form-grid">
              <el-form-item>
                <template #label><span class="opt-label">端口<el-tooltip content='Web 管理面板监听端口。Go 源码无默认值，设为 0 则面板不启动。建议 7400。' placement="auto" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.webPort" placeholder="必填才能启用面板" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">用户名<span class="opt-default">默认 admin</span><el-tooltip placement="auto" :content="tips.webUser" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.user" placeholder="用户名" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">密码<el-tooltip placement="auto" :content="tips.webPassword" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.password" type="password" show-password placeholder="密码" @input="onFormChange" />
              </el-form-item>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating preview button -->
    <el-tooltip content="TOML 预览" placement="left">
      <button class="floating-preview-btn" @click="previewCollapsed = false">
        <el-icon><View /></el-icon>
      </button>
    </el-tooltip>

    <!-- TOML Preview Drawer -->
    <el-drawer :model-value="!previewCollapsed" @update:model-value="previewCollapsed = !$event" title="TOML 预览" direction="rtl" :size="isMobile ? '100%' : '500px'">
      <pre class="preview-content">{{ previewToml }}</pre>
    </el-drawer>

    <ConfirmDialog v-model="confirmVisible" title="确认更新" message="此操作将更新 frpc 配置并重载。是否继续？" confirm-text="更新" :loading="uploading" :is-mobile="isMobile" @confirm="doUpload" />

    <ConfirmDialog
      v-model="deleteProxyVisible"
      title="删除代理"
      :message="`确定删除代理「${detectedProxies[proxyToDelete]?.name || ''}」？`"
      confirm-text="删除"
      :is-mobile="isMobile"
      danger
      align-center
      @confirm="confirmDeleteProxy"
    />

    <el-dialog v-model="proxyDialogVisible" :title="editingIndex >= 0 ? '编辑代理' : '添加代理'" :width="isMobile ? '100%' : '520px'" :fullscreen="isMobile">
      <el-form label-position="top">
        <div class="proxy-dialog-section">
          <div class="proxy-dialog-switch-row">
            <span class="proxy-dialog-switch-label">启用</span>
            <el-switch v-model="newProxy.enabled" />
          </div>
        </div>
        <div class="proxy-dialog-divider"></div>
        <div class="proxy-dialog-section">
          <el-form-item required>
            <template #label><span class="opt-label">名称<el-tooltip content="代理唯一标识，所有代理中不可重复" placement="auto"><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
            <el-input v-model="newProxy.name" placeholder="my-proxy" />
          </el-form-item>
        </div>
        <div class="proxy-dialog-divider"></div>
        <div class="proxy-dialog-section">
          <el-form-item label="类型" required>
            <div class="type-pills">
              <div
                v-for="t in PROXY_TYPES.slice(0, 4)"
                :key="t"
                class="type-pill"
                :class="[`type-pill-${pillColor(t)}`, { 'type-pill-active': newProxy.type === t }]"
                @click="newProxy.type = t"
              >
                {{ t.toUpperCase() }}
              </div>
              <span class="type-pill type-pill-more" @click="showMoreTypes = !showMoreTypes">
                {{ showMoreTypes ? '收起 ▴' : '更多 ▾' }}
              </span>
            </div>
            <div v-if="showMoreTypes" class="type-pills type-pills-extra">
              <div
                v-for="t in PROXY_TYPES.slice(4)"
                :key="t"
                class="type-pill"
                :class="[`type-pill-${pillColor(t)}`, { 'type-pill-active': newProxy.type === t }]"
                @click="newProxy.type = t"
              >
                {{ t.toUpperCase() }}
              </div>
            </div>
          </el-form-item>
        </div>
        <div class="proxy-dialog-divider"></div>
        <div class="proxy-dialog-section">
          <el-form-item>
            <template #label><span class="opt-label">本地 IP<el-tooltip content="内网服务所在机器的 IP 地址，本机通常是 127.0.0.1" placement="auto"><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
            <el-input v-model="newProxy.localIP" placeholder="127.0.0.1" />
          </el-form-item>
          <el-form-item required>
            <template #label><span class="opt-label">本地端口<el-tooltip content="内网服务监听的端口，如 SSH=22、HTTP=80" placement="auto"><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
            <el-input v-model.number="newProxy.localPort" type="number" :placeholder="portPlaceholder" />
          </el-form-item>
        </div>
        <div class="proxy-dialog-divider"></div>
        <div class="proxy-dialog-section">
          <el-form-item v-if="newProxy.type === 'tcp' || newProxy.type === 'udp'" label="远程端口" required class="remote-port-item">
            <div class="flow-row">
              <el-input v-model.number="newProxy.remotePort" type="number" placeholder="frps 对外端口" class="flow-input" />
              <span class="flow-arrow">→</span>
              <span class="flow-local">{{ newProxy.localIP || '127.0.0.1' }}:{{ newProxy.localPort || '?' }}</span>
            </div>
            <span class="field-hint">外部用户通过 frps 的此端口访问你的内网服务</span>
          </el-form-item>
          <el-form-item v-if="newProxy.type === 'http' || newProxy.type === 'https' || newProxy.type === 'tcpmux'">
            <template #label>
              <span class="opt-label">
                自定义域名
                <el-tooltip content="你自己的域名，需要 DNS 指向 frps 服务器。支持通配符 *.example.com" placement="auto">
                  <el-icon class="tip-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
            <StringListEditor v-model="newProxy.customDomains" placeholder="example.com" />
          </el-form-item>
          <el-form-item v-if="newProxy.type === 'http' || newProxy.type === 'https' || newProxy.type === 'tcpmux'">
            <template #label>
              <span class="opt-label">
                子域名
                <el-tooltip content="无需自有域名，由 frps 管理员配好 subdomainHost 后自动分配。填 test 得到 test.frp.example.com" placement="auto">
                  <el-icon class="tip-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
            <el-input v-model="newProxy.subdomain" placeholder="test" />
          </el-form-item>
          <el-form-item v-if="newProxy.type === 'http'" label="路径">
            <StringListEditor v-model="newProxy.locations" placeholder="/api" />
          </el-form-item>
          <el-form-item v-if="newProxy.type === 'http' || newProxy.type === 'tcpmux'">
            <template #label><span class="opt-label">HTTP 用户<el-tooltip content="访问此代理时需要的 Basic Auth 用户名，浏览器会弹出登录框" placement="auto"><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
            <el-input v-model="newProxy.httpUser" placeholder="Basic Auth 用户名" />
          </el-form-item>
          <el-form-item v-if="newProxy.type === 'http' || newProxy.type === 'tcpmux'">
            <template #label><span class="opt-label">HTTP 密码<el-tooltip content="配合 HTTP 用户使用，留空则不需要密码" placement="auto"><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
            <el-input v-model="newProxy.httpPassword" type="password" show-password placeholder="Basic Auth 密码" />
          </el-form-item>
          <el-form-item v-if="newProxy.type === 'stcp' || newProxy.type === 'sudp' || newProxy.type === 'xtcp'">
            <template #label><span class="opt-label">密钥<el-tooltip content="预共享密钥，访问者必须提供相同密钥才能建立连接" placement="auto"><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
            <el-input v-model="newProxy.secretKey" type="password" show-password placeholder="共享密钥" />
          </el-form-item>
          <el-form-item v-if="newProxy.type === 'tcpmux'">
            <template #label><span class="opt-label">复用器<el-tooltip content="TCPMux 模式使用的复用协议，目前仅支持 httpconnect" placement="auto"><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
            <el-select v-model="newProxy.multiplexer" style="width:100%">
              <el-option label="httpconnect（默认）" value="" />
              <el-option label="httpconnect" value="httpconnect" />
            </el-select>
          </el-form-item>
        </div>
        <div v-if="newProxy.type !== 'https'" class="proxy-dialog-divider"></div>
        <div v-if="newProxy.type !== 'https'" class="proxy-dialog-section">
          <div class="proxy-dialog-switch-row">
            <span class="proxy-dialog-switch-label">压缩传输<el-tooltip content="开启后 frpc ↔ frps 数据压缩传输，节省带宽但消耗 CPU。HTTPS 无效" placement="auto"><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span>
            <el-switch v-model="newProxy.useCompression" />
          </div>
          <div class="proxy-dialog-switch-row">
            <span class="proxy-dialog-switch-label">加密传输<el-tooltip content="开启后 frpc ↔ frps 数据加密传输。HTTPS 因已有 TLS，无需重复加密" placement="auto"><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span>
            <el-switch v-model="newProxy.useEncryption" />
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="proxyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProxy">{{ editingIndex >= 0 ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Link, QuestionFilled, Connection, Setting, Lock, User, View, Edit, Delete } from '@element-plus/icons-vue'
import { useClientStore } from '../stores/client'
import { useConnectionStore } from '../stores/connection'
import ActionButton from '@shared/components/ActionButton.vue'
import ConfirmDialog from '@shared/components/ConfirmDialog.vue'
import StringListEditor from '../components/StringListEditor.vue'
import { useResponsive } from '../composables/useResponsive'
import { parseToml, serializeToml } from '../utils/toml'
import { CONFIG_DEFAULTS } from '../utils/defaults'
import { isEffective, getNote } from '../config-modes'
import type { ModeId } from '../config-modes'
import type { FrpcConfig } from '../utils/toml'

const { isMobile } = useResponsive()
const clientStore = useClientStore()
const connStore = useConnectionStore()

const activeTab = ref<'connect' | 'proxy'>('connect')
const previewCollapsed = ref(true)
const showOptional = ref(true)
const connMode = ref<'tcpMux' | 'tcpNoMux' | 'quic'>('tcpMux')

const tips = {
  serverAddr: 'frps 服务器的 IP 或域名。默认 "0.0.0.0"。必填项。',
  serverPort: 'frps 服务器端口。默认 7000。大部分场景无需修改。',
  authToken: 'Token 认证密钥，必须与服务端 auth.token 完全一致。认证方式默认 "token"。无默认值，必填。',
  protocol: '传输协议。QUIC 模式下固定为 "quic"，基于 UDP 传输，原生支持多路复用和连接迁移。',
  tcpMux: '是否开启 yamux 多路复用。true=所有控制/工作连接共享 1 条 TCP；false=每条连接独立 TCP。默认 true。<br/><br/>TCPMux 模式下，yamux 每 30s 发送一次 ping 保活，只要 yamux session 存活，所有 work conn stream 就不会被 NAT/防火墙断开。关闭后工作连接建立后完全静默，无任何应用层保活（控制连接仍有 30s 心跳），需依赖 OS TCP keepalive。',
  tcpMuxKeepaliveInterval: 'yamux session 保活 ping 间隔（秒）。yamux 每隔 N 秒发送一次 ping 帧，维持底层 TCP 有流量，防止中间 NAT/防火墙因"空闲超时"丢弃连接。<br/><br/>默认 30s，远低于常见 NAT 空闲超时（60~300s），连接永远不会被误杀。调小可对抗短超时 NAT（如 60s 阈值时设 15s）；调大可减少无效通信。本模式实际保活就靠这一项。<br/><br/>仅在 tcpMux=true 时生效。',
  tcpKeepalive: 'OS 级 TCP keepalive 间隔（秒）。TCP 连接空闲超过此时长后，操作系统发送 keepalive 探测包判断连接是否存活。<br/><br/>默认 7200s（2 小时），远大于常见 NAT 空闲超时（60~300s），所以直连模式下必须调小到 60s 左右。注意：这不是"主动保活"而是"缩短断连检测延迟"。<br/><br/>TCPMux 模式下 yamux 每 30s 通信一次，TCP 空闲绝不超过 30s，OS keepalive 永远不会触发，不写也不影响。',
  poolCount: '连接池大小。frpc 预先向 frps 建立的工作连接数。<br/><br/>TCPMux 模式默认 1，加大可减少新用户连接等待时间。直连模式下加大池可加速轮转，减少单连接闲置时间从而降低被 NAT 断开概率。QUIC 模式建议 ≥3，因为 stream 建立几乎无开销。<br/><br/>取值范围 1~maxPoolCount（服务端）。',
  dialServerTimeout: '客户端连接 frps 的拨号超时（秒）。默认 10。通常无需调整。仅在网络延迟极高的场景适当调大。',
  wireProtocol: 'frpc/frps 内部通信协议版本。默认 v1，可选 v2。仅在服务端也启用 v2 时修改。一般无需配置。',
  tlsEnable: '是否启用 TLS 传输加密。默认 true。<br/><br/>QUIC 协议强制要求 TLS 1.3，必须保持 true。其它模式下关闭仅用于内网测试环境（不推荐）。',
  disableCustomTLSFirstByte: '是否禁用自定义 TLS 首字节协议协商。默认 true（禁用），使用标准 TLS 握手。仅当 frps 使用了 frp 自定义的 TLS 首字节时设为 false。一般不需要修改。',
  tlsCertFile: 'TLS 客户端证书文件路径。仅 mTLS（双向认证）场景使用，普通 token 认证无需填写。QUIC 下服务端必须提供证书。',
  tlsKeyFile: 'TLS 客户端密钥文件路径。仅 mTLS 场景使用，配合证书文件一起使用。普通场景留空。',
  tlsServerName: 'TLS SNI（Server Name Indication）服务器名称。用于 TLS 握手时的域名验证。留空则使用 serverAddr 的值。Go 后端支持所有协议，当前 UI 仅 QUIC 模式显示。',
  quicKeepalivePeriod: 'QUIC PING 帧发送间隔（秒）。quic-go 每隔 N 秒发送一个 PING 帧保持连接活跃。\n\nUDP 不像 TCP 有面向连接的状态，NAT 设备需要看到持续流量才不丢弃 UDP 映射。默认 10s 已覆盖绝大多数场景。如果 NAT 环境极度恶劣可设 5s。',
  quicMaxIdleTimeout: 'QUIC 连接空闲断连超时（秒）。连接连续空闲 N 秒（无任何帧，含 PING 帧）后自动关闭。默认 30s。\n\n正常情况下 keepalivePeriod（10s）< maxIdleTimeout（30s），保活 PING 阻止超时触发。若 PING 发送失败，最多 30s 后断连并触发重连。',
  quicMaxIncomingStreams: 'QUIC 最大并发流数。默认 100000。一般不需要修改，除非需要限制并发代理连接数。',
  webUser: 'Dashboard 管理面板登录用户名。配合下方密码和端口使用。webServer.port 默认 0（不启动），需手动设置端口。',
  webPassword: 'Dashboard 管理面板登录密码。搭配上方用户名使用。',
  logFile: '日志输出文件路径。留空则输出到控制台（stdout）。设为如 "./frpc.log" 则写入文件。',
  logLevel: '日志输出级别。trace（最详细）< debug < info（默认）< warn < error（仅错误）。生产环境建议 info，排查问题时临时调低。',
  logMaxDays: '日志文件保留天数。超过天数的日志自动删除。默认 3 天。设为 0 不自动删除。',
}

interface ConnModeItem {
  id: 'tcpMux' | 'tcpNoMux' | 'quic'
  label: string
  desc: string
  tooltip: string
}

const connModes: ConnModeItem[] = [
  {
    id: 'tcpMux' as const,
    label: '多路复用',
    desc: 'TCP Mux 流复用，低延迟推荐',
    tooltip: 'frpc 与 frps 之间只建立一条 TCP 连接，通过 Hashicorp yamux 库在上面创建多条逻辑流（stream），分别承载控制连接、工作连接等。\n\nyamux 每 30s 发送一次 ping 保活，只要 yamux session 存活，复用在上面的所有 work conn stream 就不会被 NAT/防火墙断开。\n\n默认模式，几乎零配置。单端口单连接，防火墙最易穿透。',
  },
  {
    id: 'tcpNoMux' as const,
    label: 'TCP 直连',
    desc: '无多路复用，独立 TCP 连接探活',
    tooltip: '关闭 yamux 流复用后，每条连接都是独立 TCP：控制连接一条、每个工作连接一条。\n\n工作连接建立后放进池中即不再有任何读写，没有 yamux keepalive、没有应用层心跳。唯一发现断连的机制是 OS 级 TCP keepalive，默认 7200s 远大于 NAT 超时（60~300s），池中连接极易在消费前被丢弃。\n\n必须调小 TCP 保活间隔 + 加大连接池来对抗。仅用于兼容不支持 TCPMux 的老旧服务端。',
  },
  {
    id: 'quic' as const,
    label: 'QUIC',
    desc: 'UDP 协议，抗丢包弱网环境',
    tooltip: '基于 UDP 的传输协议，原生支持多路复用。在一条 QUIC 连接上创建多条流承载控制和工作连接。\n\n内置 QUIC PING（每 10s）保活 NAT/UDP 映射，支持连接迁移（WiFi↔4G 切换无需重连），无 TCP 队头阻塞。\n\n需要 TLS 证书（QUIC 强制 TLS 1.3），服务端需开放 UDP 端口。移动端/弱网/跨国场景强烈推荐。',
  },
]

const modeKeyFields: Record<string, string[]> = {
  tcpMux: ['serverAddr', 'authToken'],
  tcpNoMux: ['serverAddr', 'authToken', 'tcpMux', 'dialServerKeepalive', 'poolCount'],
  quic: ['serverAddr', 'authToken'],
}

const isKeyField = (name: string) => (modeKeyFields[connMode.value] || []).includes(name)

const poolCountHint = computed(() => {
  if (connMode.value === 'quic') return '默认 1，QUIC 建议 ≥3'
  if (connMode.value === 'tcpNoMux') return '默认 1，直连建议 5'
  return '默认 1'
})

const detectedProxies = computed(() => parseToml(clientStore.config).proxies)

const mismatchedFields = computed(() => {
  const parsed = parseToml(clientStore.config)
  const tr = getSection(parsed.sections, 'transport')
  if (!tr) return []
  const mode = connMode.value as ModeId
  const warnings: { key: string; note: string }[] = []
  const checkKeys = [
    'protocol', 'tcpMux', 'tcpMuxKeepaliveInterval', 'dialServerKeepalive',
    'dialServerTimeout', 'poolCount', 'wireProtocol', 'heartbeatInterval', 'heartbeatTimeout',
    'tls.enable', 'tls.disableCustomTLSFirstByte', 'tls.certFile', 'tls.keyFile', 'tls.serverName',
    'quic.keepalivePeriod', 'quic.maxIdleTimeout', 'quic.maxIncomingStreams',
  ]
  for (const key of checkKeys) {
    const val = getVal(tr, key)
    if (val !== undefined && !isEffective(mode, key)) {
      warnings.push({ key, note: getNote(mode, key) || '当前模式下不生效' })
    }
  }
  return warnings
})

const proxySummary = (p: Record<string, any>) => {
  if (p.customDomains) {
    const domains = Array.isArray(p.customDomains) ? p.customDomains.join(', ') : String(p.customDomains)
    return `→ ${p.localIP || '127.0.0.1'}:${p.localPort || '-'}（${domains}）`
  }
  if (p.subdomain) return `→ ${p.localIP || '127.0.0.1'}:${p.localPort || '-'}（${p.subdomain}）`
  if (p.secretKey) return `→ ${p.localIP || '127.0.0.1'}:${p.localPort || '-'}（密钥已配置）`
  return `→ ${p.localIP || '127.0.0.1'}:${p.localPort || '-'}`
}

const proxyCardClass = (type: string) => {
  if (type === 'http' || type === 'https') return 'proxy-type-http'
  if (type === 'stcp' || type === 'sudp' || type === 'xtcp') return 'proxy-type-secure'
  if (type === 'tcpmux') return 'proxy-type-tcpmux'
  return 'proxy-type-tcp'
}

const tagType = (type: string) => {
  if (type === 'http' || type === 'https') return 'success'
  return ''
}

const pillColor = (type: string) => {
  if (type === 'http' || type === 'https') return 'green'
  if (type === 'tcp' || type === 'udp') return 'blue'
  if (type === 'tcpmux') return 'orange'
  return 'purple'
}

const removeProxy = (index: number) => {
  proxyToDelete.value = index
  deleteProxyVisible.value = true
}

const confirmDeleteProxy = () => {
  const idx = proxyToDelete.value
  if (idx < 0) return
  const parsed = parseToml(clientStore.config)
  parsed.proxies.splice(idx, 1)
  clientStore.config = serializeToml(parsed)
  proxyToDelete.value = -1
  deleteProxyVisible.value = false
  rebuildPreview()
}

const proxyToDelete = ref(-1)
const deleteProxyVisible = ref(false)
const showMoreTypes = ref(false)
const pageLoading = ref(true)

const portPlaceholder = computed(() => {
  if (newProxy.type === 'http') return 'e.g. 80'
  if (newProxy.type === 'https') return 'e.g. 443'
  return 'e.g. 22'
})

const proxyDialogVisible = ref(false)
const editingIndex = ref(-1)
const dragIndex = ref(-1)
const dragOverIndex = ref(-1)

const onDragStart = (i: number, e: DragEvent) => {
  dragIndex.value = i
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

const onDragOver = (i: number) => {
  dragOverIndex.value = i
}

const onDragLeave = () => {
  dragOverIndex.value = -1
}

const onDrop = (i: number) => {
  if (dragIndex.value < 0 || dragIndex.value === i) {
    dragOverIndex.value = -1
    return
  }
  const parsed = parseToml(clientStore.config)
  const item = parsed.proxies.splice(dragIndex.value, 1)[0]
  parsed.proxies.splice(i, 0, item)
  clientStore.config = serializeToml(parsed)
  dragIndex.value = -1
  dragOverIndex.value = -1
  rebuildPreview()
}

const newProxy = reactive({
  name: '',
  type: 'tcp' as string,
  localIP: '127.0.0.1',
  localPort: undefined as number | undefined,
  remotePort: undefined as number | undefined,
  customDomains: [] as string[],
  subdomain: '',
  locations: [] as string[],
  httpUser: '',
  httpPassword: '',
  secretKey: '',
  multiplexer: '',
  enabled: true,
  useCompression: false,
  useEncryption: false,
})

const PROXY_TYPES = ['tcp', 'udp', 'http', 'https', 'tcpmux', 'stcp', 'sudp', 'xtcp']

const openProxyDialog = () => {
  editingIndex.value = -1
  newProxy.name = ''
  newProxy.type = 'tcp'
  newProxy.localIP = '127.0.0.1'
  newProxy.localPort = undefined
  newProxy.remotePort = undefined
  newProxy.customDomains = []
  newProxy.subdomain = ''
  newProxy.locations = []
  newProxy.httpUser = ''
  newProxy.httpPassword = ''
  newProxy.secretKey = ''
  newProxy.multiplexer = ''
  newProxy.enabled = true
  newProxy.useCompression = false
  newProxy.useEncryption = false
  proxyDialogVisible.value = true
}

const editProxy = (index: number) => {
  editingIndex.value = index
  const p = detectedProxies.value[index]
  const t = p.type || 'tcp'
  newProxy.name = p.name || ''
  newProxy.type = t
  showMoreTypes.value = ['tcpmux', 'stcp', 'sudp', 'xtcp'].includes(t)
  newProxy.localIP = p.localIP || '127.0.0.1'
  newProxy.localPort = p.localPort

  // Only load type-specific fields based on actual type
  newProxy.remotePort = undefined
  newProxy.customDomains = []
  newProxy.subdomain = ''
  newProxy.locations = []
  newProxy.httpUser = ''
  newProxy.httpPassword = ''
  newProxy.secretKey = ''
  newProxy.multiplexer = ''

  if (t === 'tcp' || t === 'udp') {
    newProxy.remotePort = p.remotePort
  }
  if (t === 'http' || t === 'https' || t === 'tcpmux') {
    newProxy.customDomains = Array.isArray(p.customDomains) ? [...p.customDomains] : (p.customDomains ? [p.customDomains] : [])
    newProxy.subdomain = p.subdomain || ''
  }
  if (t === 'http') {
    newProxy.locations = Array.isArray(p.locations) ? [...p.locations] : (p.locations ? [p.locations] : [])
  }
  if (t === 'http' || t === 'tcpmux') {
    newProxy.httpUser = p.httpUser || ''
    newProxy.httpPassword = p.httpPassword || ''
  }
  if (t === 'tcpmux') {
    newProxy.multiplexer = p.multiplexer || ''
  }
  if (t === 'stcp' || t === 'sudp' || t === 'xtcp') {
    newProxy.secretKey = p.secretKey || ''
  }

  newProxy.enabled = p.enabled !== false
  newProxy.useCompression = p['transport.useCompression'] === true
  newProxy.useEncryption = p['transport.useEncryption'] === true
  proxyDialogVisible.value = true
}

const saveProxy = () => {
  if (!newProxy.name) { ElMessage.warning('请输入代理名称'); return }
  if (newProxy.localPort == null) { ElMessage.warning('请输入本地端口'); return }
  if ((newProxy.type === 'tcp' || newProxy.type === 'udp') && newProxy.remotePort == null) { ElMessage.warning('请输入远程端口'); return }

  const parsed = parseToml(clientStore.config)
  const proxy: Record<string, any> = {
    name: newProxy.name,
    type: newProxy.type,
    localIP: newProxy.localIP || '127.0.0.1',
    localPort: newProxy.localPort,
  }
  if (newProxy.useCompression) proxy['transport.useCompression'] = true
  if (newProxy.useEncryption) proxy['transport.useEncryption'] = true
  if (newProxy.enabled === false) proxy.enabled = false

  // Type-specific fields
  if ((newProxy.type === 'tcp' || newProxy.type === 'udp') && newProxy.remotePort != null) {
    proxy.remotePort = newProxy.remotePort
  }
  if (newProxy.type === 'http' || newProxy.type === 'https' || newProxy.type === 'tcpmux') {
    if (newProxy.customDomains.length > 0) proxy.customDomains = newProxy.customDomains
    if (newProxy.subdomain) proxy.subdomain = newProxy.subdomain
  }
  if (newProxy.type === 'http') {
    if (newProxy.locations.length > 0) proxy.locations = newProxy.locations
  }
  if (newProxy.type === 'http' || newProxy.type === 'tcpmux') {
    if (newProxy.httpUser) proxy.httpUser = newProxy.httpUser
    if (newProxy.httpPassword) proxy.httpPassword = newProxy.httpPassword
  }
  if (newProxy.type === 'tcpmux' && newProxy.multiplexer) {
    proxy.multiplexer = newProxy.multiplexer
  }
  if (newProxy.type === 'stcp' || newProxy.type === 'sudp' || newProxy.type === 'xtcp') {
    if (newProxy.secretKey) proxy.secretKey = newProxy.secretKey
  }

  if (editingIndex.value >= 0) {
    parsed.proxies[editingIndex.value] = proxy
  } else {
    parsed.proxies.push(proxy)
  }

  clientStore.config = serializeToml(parsed)
  proxyDialogVisible.value = false
  rebuildPreview()
}

// Reset type-specific fields when type changes in dialog
let prevDialogType = newProxy.type
watch(
  () => newProxy.type,
  (newType) => {
    if (newType === prevDialogType) return
    prevDialogType = newType
    newProxy.remotePort = undefined
    newProxy.customDomains = []
    newProxy.subdomain = ''
    newProxy.locations = []
    newProxy.httpUser = ''
    newProxy.httpPassword = ''
    newProxy.secretKey = ''
    newProxy.multiplexer = ''
  },
)

const form = reactive({
  serverAddr: '',
  serverPort: '',
  user: '',
  password: '',
  webPort: '',
  authToken: '',
  tcpMux: true,
  tcpMuxKeepaliveInterval: '',
  dialServerKeepalive: '',
  dialServerTimeout: '',
  heartbeatInterval: '',
  heartbeatTimeout: '',
  poolCount: '',
  wireProtocol: '',
  tlsEnable: true,
  tlsDisableCustomFirstByte: true,
  tlsCertFile: '',
  tlsKeyFile: '',
  tlsServerName: '',
  quicKeepalivePeriod: '',
  quicMaxIdleTimeout: '',
  quicMaxIncomingStreams: '',
  logFile: '',
  logLevel: 'info',
  logMaxDays: '',
})

const previewToml = ref('')
const syncing = false

type ModePreset = Partial<typeof form>

const modePresets: Record<string, ModePreset> = {
  tcpMux: { tcpMux: true },
  tcpNoMux: { tcpMux: false },
  quic: { tcpMux: false },
}

const applyPreset = (mode: string) => {
  const preset = modePresets[mode]
  if (!preset) return
  for (const key of Object.keys(preset)) {
    ;(form as any)[key] = (preset as any)[key]
  }
}

const selectMode = (m: 'tcpMux' | 'tcpNoMux' | 'quic') => {
  if (m === connMode.value) return
  connMode.value = m
  activeTab.value = 'connect'
  applyPreset(m)
  rebuildPreview()
}

const getSection = (secs: Record<string, Record<string, any>>, name: string) => {
  for (const key of Object.keys(secs)) {
    if (key.toLowerCase() === name.toLowerCase()) return secs[key]
  }
  return undefined
}

const getVal = (obj: Record<string, any> | undefined, key: string): any => {
  if (!obj) return undefined
  if (key in obj) return obj[key]
  const lower = key.toLowerCase()
  for (const k of Object.keys(obj)) {
    if (k.toLowerCase() === lower) return obj[k]
  }
  return undefined
}

const isDefault = (key: string, value: any): boolean => {
  const def = CONFIG_DEFAULTS[key]
  if (def === undefined || def === null) return !value
  return value === def || value === '' || (typeof def === 'number' && Number(value) === def)
}

const formToConfig = (): FrpcConfig => {
  const roots: Record<string, any> = {}
  const sections: Record<string, Record<string, any>> = {}
  const order: string[] = []

  if (form.serverAddr) roots['serverAddr'] = form.serverAddr
  if (form.serverPort) roots['serverPort'] = Number(form.serverPort)

  if (form.authToken) {
    sections['auth'] = { method: 'token', token: form.authToken }
    order.push('__section:auth')
  }

  if (connMode.value === 'quic') {
    const tr: Record<string, any> = { protocol: 'quic' }
    if (form.poolCount && !isDefault('transport.poolCount', form.poolCount)) tr['poolCount'] = Number(form.poolCount)
    if (form.tlsEnable || connMode.value === 'quic') {
      tr['tls.enable'] = true
      if (!isDefault('transport.tls.disableCustomTLSFirstByte', form.tlsDisableCustomFirstByte)) tr['tls.disableCustomTLSFirstByte'] = form.tlsDisableCustomFirstByte
      if (form.tlsCertFile) tr['tls.certFile'] = form.tlsCertFile
      if (form.tlsKeyFile) tr['tls.keyFile'] = form.tlsKeyFile
      if (form.tlsServerName) tr['tls.serverName'] = form.tlsServerName
    }
    if (form.quicKeepalivePeriod && !isDefault('transport.quic.keepalivePeriod', form.quicKeepalivePeriod)) tr['quic.keepalivePeriod'] = Number(form.quicKeepalivePeriod)
    if (form.quicMaxIdleTimeout && !isDefault('transport.quic.maxIdleTimeout', form.quicMaxIdleTimeout)) tr['quic.maxIdleTimeout'] = Number(form.quicMaxIdleTimeout)
    if (form.quicMaxIncomingStreams && !isDefault('transport.quic.maxIncomingStreams', form.quicMaxIncomingStreams)) tr['quic.maxIncomingStreams'] = Number(form.quicMaxIncomingStreams)
    sections['transport'] = tr
    order.push('__section:transport')
  } else {
    const tr: Record<string, any> = {}
    if (!form.tcpMux) tr['tcpMux'] = false
    if (form.tcpMux && form.tcpMuxKeepaliveInterval && !isDefault('transport.tcpMuxKeepaliveInterval', form.tcpMuxKeepaliveInterval)) {
      tr['tcpMuxKeepaliveInterval'] = Number(form.tcpMuxKeepaliveInterval)
    }
    if (form.dialServerKeepalive && !isDefault('transport.dialServerKeepalive', form.dialServerKeepalive)) {
      tr['dialServerKeepalive'] = Number(form.dialServerKeepalive)
    }
    if (form.poolCount && !isDefault('transport.poolCount', form.poolCount)) tr['poolCount'] = Number(form.poolCount)
    if (form.dialServerTimeout && !isDefault('transport.dialServerTimeout', form.dialServerTimeout)) tr['dialServerTimeout'] = Number(form.dialServerTimeout)
    if (form.heartbeatInterval) tr['heartbeatInterval'] = Number(form.heartbeatInterval)
    if (form.heartbeatTimeout) tr['heartbeatTimeout'] = Number(form.heartbeatTimeout)
    if (form.wireProtocol && !isDefault('transport.wireProtocol', form.wireProtocol)) tr['wireProtocol'] = form.wireProtocol
    if (form.tlsEnable) {
      tr['tls.enable'] = true
      if (!isDefault('transport.tls.disableCustomTLSFirstByte', form.tlsDisableCustomFirstByte)) tr['tls.disableCustomTLSFirstByte'] = form.tlsDisableCustomFirstByte
      if (form.tlsCertFile) tr['tls.certFile'] = form.tlsCertFile
      if (form.tlsKeyFile) tr['tls.keyFile'] = form.tlsKeyFile
    }
    sections['transport'] = tr
    order.push('__section:transport')
  }

  if (form.webPort || form.user || form.password) {
    const ws: Record<string, any> = {}
    ws['addr'] = '0.0.0.0'
    if (form.webPort) ws['port'] = Number(form.webPort)
    if (form.user) ws['user'] = form.user
    if (form.password) ws['password'] = form.password
    sections['webServer'] = ws
    order.push('__section:webServer')
  }

  return { roots, sections, proxies: [], visitors: [], order }
}

const applyParsedToForm = (cfg: FrpcConfig) => {
  form.serverAddr = getVal(cfg.roots, 'serverAddr') || ''
  form.serverPort = getVal(cfg.roots, 'serverPort') != null ? String(getVal(cfg.roots, 'serverPort')) : ''

  const auth = getSection(cfg.sections, 'auth')
  form.authToken = getVal(auth, 'token') || ''

  const tr = getSection(cfg.sections, 'transport')
  if (tr) {
    if (getVal(tr, 'protocol') === 'quic') connMode.value = 'quic'
    else if (getVal(tr, 'tcpMux') === false) connMode.value = 'tcpNoMux'
    else connMode.value = 'tcpMux'

    form.tcpMux = getVal(tr, 'tcpMux') !== false
    form.tcpMuxKeepaliveInterval = getVal(tr, 'tcpMuxKeepaliveInterval') != null ? String(getVal(tr, 'tcpMuxKeepaliveInterval')) : ''
    form.dialServerKeepalive = getVal(tr, 'dialServerKeepalive') != null ? String(getVal(tr, 'dialServerKeepalive')) : ''
    form.dialServerTimeout = getVal(tr, 'dialServerTimeout') != null ? String(getVal(tr, 'dialServerTimeout')) : ''
    form.heartbeatInterval = getVal(tr, 'heartbeatInterval') != null ? String(getVal(tr, 'heartbeatInterval')) : ''
    form.heartbeatTimeout = getVal(tr, 'heartbeatTimeout') != null ? String(getVal(tr, 'heartbeatTimeout')) : ''
    form.poolCount = getVal(tr, 'poolCount') != null ? String(getVal(tr, 'poolCount')) : ''
    form.wireProtocol = getVal(tr, 'wireProtocol') || ''

    form.tlsEnable = getVal(tr, 'tls.enable') !== false || getVal(tr, 'protocol') === 'quic'
    form.tlsDisableCustomFirstByte = getVal(tr, 'tls.disableCustomTLSFirstByte') !== false
    form.tlsCertFile = getVal(tr, 'tls.certFile') || ''
    form.tlsKeyFile = getVal(tr, 'tls.keyFile') || ''
    form.tlsServerName = getVal(tr, 'tls.serverName') || ''

    form.quicKeepalivePeriod = getVal(tr, 'quic.keepalivePeriod') != null ? String(getVal(tr, 'quic.keepalivePeriod')) : ''
    form.quicMaxIdleTimeout = getVal(tr, 'quic.maxIdleTimeout') != null ? String(getVal(tr, 'quic.maxIdleTimeout')) : ''
    form.quicMaxIncomingStreams = getVal(tr, 'quic.maxIncomingStreams') != null ? String(getVal(tr, 'quic.maxIncomingStreams')) : ''
  }

  const ws = getSection(cfg.sections, 'webServer')
  form.webPort = getVal(ws, 'port') != null ? String(getVal(ws, 'port')) : ''
  form.user = getVal(ws, 'user') || ''
  form.password = getVal(ws, 'password') || ''

  const lg = getSection(cfg.sections, 'log')
  form.logFile = getVal(lg, 'to') || ''
  form.logLevel = getVal(lg, 'level') || 'info'
  form.logMaxDays = getVal(lg, 'maxDays') != null ? String(getVal(lg, 'maxDays')) : ''
}

const rebuildPreview = () => {
  if (syncing) return
  const current = parseToml(clientStore.config)
  const cfg = formToConfig()
  cfg.proxies = current.proxies
  cfg.visitors = current.visitors

  // Merge form-generated sections into current sections (preserve unknown keys)
  for (const secName of Object.keys(cfg.sections)) {
    if (current.sections[secName]) {
      Object.assign(current.sections[secName], cfg.sections[secName])
      cfg.sections[secName] = current.sections[secName]
    }
  }
  // Preserve root keys from current that form doesn't handle
  cfg.roots = { ...current.roots, ...cfg.roots }

  const existingOrder = ['auth', 'transport', 'webServer', 'log'].filter((s) =>
    current.sections && Object.keys(current.sections).some((k) => k.toLowerCase() === s.toLowerCase()),
  )
  const formOrder = cfg.order.filter((o) => {
    const sectionName = o.slice(10)
    return !existingOrder.some((e) => e.toLowerCase() === sectionName.toLowerCase())
  })
  cfg.order = [...existingOrder.map((s) => `__section:${s}`), ...formOrder]
  previewToml.value = serializeToml(cfg)
}

const onFormChange = () => { rebuildPreview() }

const fetchData = async () => {
  try {
    if (!connStore.connected) {
      pageLoading.value = false
      return
    }
    pageLoading.value = true
    await clientStore.fetchConfig()
    const parsed = parseToml(clientStore.config)
    applyParsedToForm(parsed)

    if (form.serverPort || form.tlsEnable || form.user || form.webPort || connMode.value === 'quic') showOptional.value = true
    rebuildPreview()
  } catch (err: any) {
    ElMessage({ showClose: true, message: '获取配置失败：' + err.message, type: 'warning' })
  } finally {
    pageLoading.value = false
  }
}

const confirmVisible = ref(false)
const uploading = ref(false)
const handleUpload = () => { confirmVisible.value = true }

const doUpload = async () => {
  const content = previewToml.value
  if (!content.trim()) { ElMessage.warning('配置内容不能为空！'); return }
  uploading.value = true
  try {
    await clientStore.saveConfig(content)
    await clientStore.reload()
    ElMessage.success('配置已更新并成功重载')
    confirmVisible.value = false
    await fetchData()
  } catch (err: any) {
    ElMessage.error('更新失败：' + err.message)
  } finally {
    uploading.value = false
  }
}

fetchData()
</script>

<style scoped lang="scss">
.configure-page {
  height: 100%;
  overflow: hidden;
  padding: $spacing-xl 40px;
  max-width: 1200px;
  margin: 0 auto;
  @include flex-column;
  gap: $spacing-sm;
}

.page-header {
  @include flex-column;
  gap: $spacing-lg;
  margin-bottom: $spacing-sm;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-lg;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
}

.docs-link {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  color: $color-text-muted;
  text-decoration: none;
  font-size: $font-size-sm;
  transition: color $transition-fast;
  &:hover { color: $color-text-primary; }
}

.split-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: $spacing-md;
  overflow: hidden;
}

.optional-panel {
  width: 300px;
  flex-shrink: 0;
  overflow-y: auto;
  padding-left: $spacing-md;
  border-left: 1px solid $color-border-lighter;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.optional-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-sm;
  .section-title { margin-bottom: 0; }
}

.mismatch-warn {
  padding: $spacing-sm $spacing-md;
  margin-bottom: $spacing-md;
  background: rgba(230, 162, 60, 0.06);
  border: 1px solid rgba(230, 162, 60, 0.2);
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  color: #c88a2e;
}

.mismatch-title {
  font-weight: $font-weight-semibold;
  display: block;
  margin-bottom: 4px;
}

.mismatch-item {
  font-size: $font-size-xs;
  margin-top: 2px;
  code { background: rgba(0,0,0,0.04); padding: 1px 4px; border-radius: 2px; }
}

.form-panel {
  flex: 1;
  overflow-y: auto;
  padding-right: $spacing-sm;
}

.mode-selector-section { padding-bottom: $spacing-md; margin-bottom: $spacing-lg; border-bottom: 1px solid $color-border-light; }

.sub-tabs {
  display: flex;
  border-bottom: 1px solid $color-border-lighter;
  margin-bottom: $spacing-lg;
}

.sub-tab-btn {
  padding: $spacing-sm $spacing-lg;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: $color-text-muted;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover { color: $color-text-primary; }
  &.active { color: $color-text-primary; border-bottom-color: $color-text-primary; }
}

.conn-mode-cards { display: flex; gap: $spacing-sm; }

.conn-mode-card {
  flex: 1;
  padding: $spacing-md;
  border: 1px solid $color-border-light;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $transition-fast;
  position: relative;

  &:hover { border-color: $color-border; background: $color-bg-hover; }
  &.active { border-color: $color-text-light; background: $color-bg-hover; box-shadow: 0 0 0 1px $color-text-light inset; }
}

.mode-name { font-size: $font-size-md; font-weight: $font-weight-semibold; color: $color-text-primary; margin-bottom: $spacing-xs; }
.mode-desc { font-size: $font-size-xs; color: $color-text-muted; }

.mode-tip-icon {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 13px;
  color: $color-text-light;
  cursor: help;
  &:hover { color: $color-text-secondary; }
}

.form-section { margin-bottom: $spacing-xl; &:last-child { margin-bottom: 0; } }

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.optional-badge {
  font-size: $font-size-xs;
  font-weight: $font-weight-normal;
  color: #67c23a;
  margin-left: $spacing-sm;
}

.optional-body {
  margin-top: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.opt-group {
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  border: 1px solid $color-border-lighter;
  border-radius: $radius-md;
  background: $color-bg-secondary;
}

.opt-group-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-xs;
  border-bottom: 1px solid $color-border-lighter;
}

.opt-group-icon {
  font-size: 15px;
  color: $color-text-secondary;
}

.opt-group-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.opt-default {
  font-size: $font-size-xs;
  color: $color-text-muted;
  margin-left: $spacing-xs;
}

.opt-label {
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.opt-hint {
  font-size: $font-size-xs;
  color: $color-text-muted;
  margin: 0 0 4px;
}

.section-title-row-with-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-xs;
  border-bottom: 1px solid $color-border-lighter;
  .section-title { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
}

.proxy-empty {
  font-size: $font-size-sm;
  color: $color-text-muted;
  padding: $spacing-md 0;
  text-align: center;
}

.add-proxy-btn {
  border: 1px dashed $color-border-light;
  color: $color-text-secondary;
  background: transparent;
  font-weight: $font-weight-medium;
  transition: all $transition-fast;

  &:hover {
    border-color: $color-text-light;
    color: $color-text-primary;
    background: $color-bg-hover;
  }
}

.proxy-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.proxy-card {
  border-radius: $radius-md;
  border: 1px solid $color-border-lighter;
  overflow: hidden;
  transition: all $transition-fast;
  cursor: pointer;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border-top-color: $color-border-light;
    border-right-color: $color-border-light;
    border-bottom-color: $color-border-light;
  }

  &.drag-over {
    border-color: $color-text-light;
    background: $color-bg-hover;
  }
}

.drag-handle {
  display: flex;
  align-items: center;
  color: $color-text-light;
  cursor: grab;
  font-size: 16px;
  letter-spacing: -2px;
  padding: 0 4px;
  margin-right: $spacing-xs;
  user-select: none;
  &:active { cursor: grabbing; }
}

.proxy-card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm $spacing-md;
  padding-left: $spacing-lg;
}

.proxy-type-tcp { border-left: 2px solid #409eff; }
.proxy-type-http { border-left: 2px solid #67c23a; }
.proxy-type-secure { border-left: 2px solid #9b59b6; }
.proxy-type-tcpmux { border-left: 2px solid #e6a23c; }

.proxy-card-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  min-width: 0;
  flex: 1;
}

.proxy-card-name {
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  white-space: nowrap;
}

.proxy-type-tag {
  flex-shrink: 0;
}

.proxy-port-tag {
  font-weight: $font-weight-semibold;
  letter-spacing: 0.3px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  flex-shrink: 0;
}

.proxy-card-detail {
  font-size: $font-size-xs;
  color: $color-text-muted;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.proxy-card-actions {
  display: flex;
  gap: $spacing-xs;
  flex-shrink: 0;
  margin-left: $spacing-md;
}

.proxy-action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: $radius-sm;
  color: $color-text-light;
  transition: all $transition-fast;

  &:hover {
    color: $color-text-primary;
    background: $color-bg-hover;
  }
}

.proxy-action-delete:hover { color: #f56c6c; background: rgba(245, 108, 108, 0.08); }

// Proxy dialog styles
.proxy-dialog-section {
  padding: 0 $spacing-xs;
}

.proxy-dialog-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.proxy-dialog-switch-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-primary;
}

.proxy-dialog-divider {
  height: 1px;
  background: $color-border-lighter;
  margin: $spacing-md 0;
}

.type-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-pills-extra {
  margin-top: 4px;
}

.type-pill-more {
  font-size: $font-size-xs;
  color: $color-text-muted;
  border-style: dashed;
  &:hover { color: $color-text-secondary; border-color: $color-text-light; }
}

.type-pill {
  padding: 6px 16px;
  border-radius: 8px;
  border: 1.5px solid $color-border-light;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-secondary;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  background: $color-bg-primary;

  &:hover {
    transform: translateY(-1px);
  }
}

.type-pill-active {
  color: #fff;
  font-weight: $font-weight-semibold;
  transform: scale(1.04);
  &:hover { opacity: 0.9; transform: scale(1.04); }
}

.type-pill-blue.type-pill-active { background: #409eff; border-color: #409eff; }
.type-pill-blue:not(.type-pill-active) { &:hover { border-color: #409eff; color: #409eff; background: rgba(64, 158, 255, 0.06); } }
.type-pill-green.type-pill-active { background: #67c23a; border-color: #67c23a; }
.type-pill-green:not(.type-pill-active) { &:hover { border-color: #67c23a; color: #67c23a; background: rgba(103, 194, 58, 0.06); } }
.type-pill-orange.type-pill-active { background: #e6a23c; border-color: #e6a23c; }
.type-pill-orange:not(.type-pill-active) { &:hover { border-color: #e6a23c; color: #e6a23c; background: rgba(230, 162, 60, 0.06); } }
.type-pill-purple.type-pill-active { background: #9b59b6; border-color: #9b59b6; }
.type-pill-purple:not(.type-pill-active) { &:hover { border-color: #9b59b6; color: #9b59b6; background: rgba(155, 89, 182, 0.06); } }

// Flow arrow row for remote port
.flow-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flow-local {
  flex: 1;
  font-size: $font-size-sm;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: $color-text-secondary;
  background: $color-bg-tertiary;
  padding: 7px 12px;
  border-radius: $radius-sm;
  white-space: nowrap;
  text-align: center;
  line-height: 1.4;
}

.flow-arrow {
  color: $color-text-light;
  font-size: 18px;
  flex-shrink: 0;
}

.flow-input {
  width: 130px;
  flex-shrink: 0;
  :deep(.el-input__wrapper) { padding: 3px 11px; }
}

.section-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  margin: 0 0 $spacing-md;
  padding-bottom: $spacing-xs;
  border-bottom: 1px solid $color-border-lighter;
}

.form-grid { @include flex-column; gap: 2px; }

.field-key {
  :deep(.el-form-item__label)::before { content: '★ '; color: #e6a23c; }
}

.field-hint {
  font-size: $font-size-xs;
  color: $color-text-muted;
  margin-left: $spacing-sm;
}

.label-with-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-tooltip__popper) {
  max-width: 300px !important;
  word-break: break-word;
}

.tip-icon {
  color: $color-text-light;
  cursor: help;
  font-size: 13px;
  margin-left: 3px;
  &:hover { color: $color-text-secondary; }
}

.form-panel {
  :deep(.el-form-item) { margin-bottom: 12px; }
  :deep(.el-select) { width: 100%; }
}

.remote-port-item {
  :deep(.el-form-item__label) {
    font-weight: $font-weight-semibold;
  }
}

@include mobile {
  .configure-page { padding: $spacing-lg; overflow-y: auto; }
  .split-layout { flex-direction: column; overflow-y: auto; }
  .form-panel { flex: none; overflow-y: visible; padding-right: 0; }
  .form-main { flex: none; min-width: 0; }
  .title-row { flex-direction: column; align-items: flex-start; gap: $spacing-sm; }
  .conn-mode-cards { flex-direction: column; }
  .optional-panel {
    width: 100%;
    border-left: none;
    border-top: 1px solid $color-border-lighter;
    padding: $spacing-md 0 0;
    margin-top: $spacing-md;
    overflow-y: visible;
  }
  .type-pills { gap: 4px; }
  .type-pill { padding: 5px 10px; font-size: $font-size-xs; }
  .flow-row { flex-direction: column; align-items: stretch; }
  .flow-input { width: 100%; }
  .flow-arrow { text-align: center; }
  .floating-preview-btn { bottom: 16px; right: 16px; }
}

.floating-preview-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border: 1px solid $color-border-light;
  border-radius: 50%;
  background: $color-bg-primary;
  color: $color-text-secondary;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all $transition-fast;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;

  &:hover {
    background: $color-bg-hover;
    color: $color-text-primary;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
}
</style>

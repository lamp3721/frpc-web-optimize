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
            <el-form-item>
              <template #label>
                <span class="label-with-tip">用户名前缀<el-tooltip placement="auto" :content="tips.clientUser" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span>
              </template>
              <el-input v-model="form.clientUser" placeholder="可选，如 office" @input="onFormChange" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span class="label-with-tip">客户端 ID<el-tooltip placement="auto" :content="tips.clientID" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span>
              </template>
              <el-input v-model="form.clientID" placeholder="可选，默认自动生成" @input="onFormChange" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span class="label-with-tip">DNS 服务器<el-tooltip placement="auto" :content="tips.dnsServer" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span>
              </template>
              <el-input v-model="form.dnsServer" placeholder="可选，如 8.8.8.8" @input="onFormChange" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <span class="label-with-tip">登录失败退出<el-tooltip placement="auto" :content="tips.loginFailExit" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span>
              </template>
              <el-switch v-model="form.loginFailExit" @change="onFormChange" />
              <span class="field-hint">{{ form.loginFailExit ? '连不上 frps 时退出进程' : '连不上 frps 时持续重试' }}</span>
            </el-form-item>
          </div>
        </div>

        <!-- 认证 -->
        <div class="form-section">
          <h3 class="section-title">认证</h3>
          <div class="form-grid">
            <el-form-item>
              <template #label>
                <span class="label-with-tip">认证方式<el-tooltip placement="auto" :content="tips.authMethod" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span>
              </template>
              <el-select v-model="form.authMethod" @change="onFormChange">
                <el-option label="Token（默认）" value="token" />
                <el-option label="OIDC" value="oidc" />
              </el-select>
            </el-form-item>

            <template v-if="form.authMethod === 'token'">
              <el-form-item :class="{ 'field-key': isKeyField('authToken') && form.authTokenSourceKind === 'static' }">
                <template #label>                <span class="label-with-tip">令牌来源<el-tooltip placement="auto" :content="tips.authTokenSource" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-select v-model="form.authTokenSourceKind" @change="onFormChange">
                  <el-option label="静态值" value="static" />
                  <el-option label="从文件读取" value="file" />
                  <el-option label="从命令获取" value="exec" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="form.authTokenSourceKind === 'static'">
                <template #label>                <span class="label-with-tip">认证令牌<el-tooltip placement="auto" :content="tips.authToken" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.authToken" placeholder="必填，与服务端一致" @input="onFormChange" />
              </el-form-item>
              <el-form-item v-if="form.authTokenSourceKind === 'file'">
                <template #label>                <span class="label-with-tip">令牌文件路径<el-tooltip placement="auto" :content="tips.authTokenFile" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.authTokenFile" placeholder="/path/to/token" @input="onFormChange" />
              </el-form-item>
              <template v-if="form.authTokenSourceKind === 'exec'">
                <el-form-item>
                  <template #label>                <span class="label-with-tip">命令<el-tooltip placement="auto" :content="tips.authTokenCommand" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.authTokenCommand" placeholder="如 etctl get token" @input="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label>                <span class="label-with-tip">命令参数<el-tooltip content='传给命令的参数，每行一个。' placement="auto" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <StringListEditor v-model="form.authTokenCommandArgs" placeholder="--flag" />
                </el-form-item>
              </template>
            </template>

            <template v-else>
              <el-form-item>
                <template #label>                <span class="label-with-tip">Client ID<el-tooltip placement="auto" :content="tips.oidcClientID" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.oidcClientID" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label>                <span class="label-with-tip">Client Secret<el-tooltip placement="auto" :content="tips.oidcClientSecret" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.oidcClientSecret" type="password" show-password @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label>                <span class="label-with-tip">Token Endpoint URL<el-tooltip placement="auto" :content="tips.oidcTokenEndpointURL" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.oidcTokenEndpointURL" placeholder="https://idp.example.com/token" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label>                <span class="label-with-tip">Audience<el-tooltip placement="auto" :content="tips.oidcAudience" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.oidcAudience" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label>                <span class="label-with-tip">Scope<el-tooltip placement="auto" :content="tips.oidcScope" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.oidcScope" placeholder="如 openid profile" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label>                <span class="label-with-tip">CA 证书文件<el-tooltip placement="auto" :content="tips.oidcTrustedCaFile" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.oidcTrustedCaFile" placeholder="/path/to/ca.pem" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label>                <span class="label-with-tip">跳过证书校验<el-tooltip placement="auto" :content="tips.oidcInsecureSkipVerify" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-switch v-model="form.oidcInsecureSkipVerify" @change="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label>                <span class="label-with-tip">OIDC 代理<el-tooltip placement="auto" :content="tips.oidcProxyURL" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.oidcProxyURL" placeholder="http://proxy:7890" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label>                <span class="label-with-tip">附加 Endpoint 参数<el-tooltip placement="auto" :content="tips.oidcAdditionalEndpointParams" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <KeyValueEditor v-model="form.oidcAdditionalEndpointParams" key-placeholder="参数名" value-placeholder="值" @update:model-value="onFormChange" />
              </el-form-item>
            </template>

            <el-form-item>
              <template #label>                <span class="label-with-tip">附加认证范围<el-tooltip placement="auto" :content="tips.authAdditionalScopes" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
              <StringListEditor v-model="form.authAdditionalScopes" placeholder="HeartBeats 或 NewWorkConns" />
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
            <el-form-item v-if="connMode !== 'quic'">
              <template #label><span class="label-with-tip">传输协议<el-tooltip placement="auto" :content="tips.transportProtocol" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span>
              </template>
              <el-select v-model="form.transportProtocol" @change="onFormChange">
                <el-option label="TCP（默认）" value="" />
                <el-option label="KCP" value="kcp" />
                <el-option label="WebSocket" value="websocket" />
                <el-option label="WSS" value="wss" />
              </el-select>
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
          <div class="opt-group" :class="{ 'opt-group-open': isGroupOpen('serverPort') }">
            <div class="opt-group-header opt-group-header-click" @click="toggleGroup('serverPort')">
              <el-icon class="opt-group-icon"><Connection /></el-icon>
              <span class="opt-group-title">服务端端口</span>
              <span class="opt-default">默认 7000</span>
              <span v-if="groupHasValue.serverPort" class="opt-group-dot" title="已自定义"></span>
              <el-icon class="opt-group-chevron"><ArrowDown /></el-icon>
            </div>
            <div class="form-grid" v-show="isGroupOpen('serverPort')">
              <el-form-item>
                <template #label><span class="opt-label">端口<el-tooltip placement="auto" :content="tips.serverPort" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.serverPort" placeholder="默认 7000" @input="onFormChange" />
              </el-form-item>
            </div>
          </div>

          <template v-if="connMode === 'tcpMux'">
            <div class="opt-group">
              <div class="opt-group-header opt-group-header-click" @click="toggleGroup('transportAdv')">
                <el-icon class="opt-group-icon"><Setting /></el-icon>
                <span class="opt-group-title">高级传输</span>
                <span v-if="groupHasValue.transportAdv" class="opt-group-dot" title="已自定义"></span>
                <el-icon class="opt-group-chevron"><ArrowDown /></el-icon>
              </div>
              <div class="form-grid" v-show="isGroupOpen('transportAdv')">
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
                <el-form-item>
                  <template #label><span class="opt-label">连接本地 IP<el-tooltip placement="auto" :content="tips.connectServerLocalIP" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.connectServerLocalIP" placeholder="可选，默认自动" @input="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">HTTP 代理<el-tooltip placement="auto" :content="tips.proxyURL" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.proxyURL" placeholder="如 http://proxy:7890" @input="onFormChange" />
                </el-form-item>
              </div>
            </div>
          </template>

          <template v-if="connMode === 'tcpNoMux'">
            <div class="opt-group">
              <div class="opt-group-header opt-group-header-click" @click="toggleGroup('transportAdv')">
                <el-icon class="opt-group-icon"><Setting /></el-icon>
                <span class="opt-group-title">高级传输</span>
                <span v-if="groupHasValue.transportAdv" class="opt-group-dot" title="已自定义"></span>
                <el-icon class="opt-group-chevron"><ArrowDown /></el-icon>
              </div>
              <div class="form-grid" v-show="isGroupOpen('transportAdv')">
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
            <div class="opt-group" :class="{ 'opt-group-open': isGroupOpen('quic') }">
              <div class="opt-group-header opt-group-header-click" @click="toggleGroup('quic')">
                <el-icon class="opt-group-icon"><Setting /></el-icon>
                <span class="opt-group-title">QUIC 协议选项</span>
                <span v-if="groupHasValue.quic" class="opt-group-dot" title="已自定义"></span>
                <el-icon class="opt-group-chevron"><ArrowDown /></el-icon>
              </div>
              <div class="form-grid" v-show="isGroupOpen('quic')">
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

          <div class="opt-group" :class="{ 'opt-group-open': isGroupOpen('tls') }">
            <div class="opt-group-header opt-group-header-click" @click="toggleGroup('tls')">
              <el-icon class="opt-group-icon"><Lock /></el-icon>
              <span class="opt-group-title">TLS</span>
              <span v-if="groupHasValue.tls" class="opt-group-dot" title="已自定义"></span>
              <el-icon class="opt-group-chevron"><ArrowDown /></el-icon>
            </div>
            <div class="form-grid" v-show="isGroupOpen('tls')">
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
                <el-form-item>
                  <template #label><span class="opt-label">受信 CA 文件<el-tooltip placement="auto" :content="tips.tlsTrustedCaFile" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.tlsTrustedCaFile" placeholder="可选，ca.crt" @input="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">使用系统 CA<span class="opt-default">默认 false</span><el-tooltip placement="auto" :content="tips.tlsUseSystemCa" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-switch v-model="form.tlsUseSystemCa" @change="onFormChange" />
                </el-form-item>
                <el-form-item>
                  <template #label><span class="opt-label">TLS SNI<el-tooltip placement="auto" :content="tips.tlsServerName" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                  <el-input v-model="form.tlsServerName" placeholder="留空=serverAddr" @input="onFormChange" />
                </el-form-item>
              </template>
            </div>
          </div>

          <div class="opt-group" :class="{ 'opt-group-open': isGroupOpen('web') }">
            <div class="opt-group-header opt-group-header-click" @click="toggleGroup('web')">
              <el-icon class="opt-group-icon"><User /></el-icon>
              <span class="opt-group-title">管理面板</span>
              <span v-if="groupHasValue.web" class="opt-group-dot" title="已自定义"></span>
              <el-icon class="opt-group-chevron"><ArrowDown /></el-icon>
            </div>
            <div class="form-grid" v-show="isGroupOpen('web')">
              <el-form-item>
                <template #label><span class="opt-label">监听地址<span class="opt-default">默认 0.0.0.0</span><el-tooltip placement="auto" :content="tips.webAddr" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.webAddr" placeholder="0.0.0.0" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">端口<el-tooltip content='Web 管理面板监听端口。Go 源码无默认值，设为 0 则面板不启动。建议 7400。' placement="auto" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.webPort" placeholder="必填才能启用面板" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">用户名<span class="opt-default">默认 admin</span><el-tooltip placement="auto" :content="tips.webUser" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.webUser" placeholder="用户名" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">密码<el-tooltip placement="auto" :content="tips.webPassword" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.webPassword" type="password" show-password placeholder="密码" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">面板 TLS 证书<el-tooltip placement="auto" :content="tips.webTlsCert" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.webTlsCertFile" placeholder="可选，面板走 HTTPS" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">面板 TLS 密钥<el-tooltip content='与面板 TLS 证书成对使用，启用后管理面板以 HTTPS 服务。' placement="auto" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.webTlsKeyFile" placeholder="可选" @input="onFormChange" />
              </el-form-item>
            </div>
          </div>

          <!-- 日志 -->
          <div class="opt-group" :class="{ 'opt-group-open': isGroupOpen('log') }">
            <div class="opt-group-header opt-group-header-click" @click="toggleGroup('log')">
              <el-icon class="opt-group-icon"><View /></el-icon>
              <span class="opt-group-title">日志</span>
              <span v-if="groupHasValue.log" class="opt-group-dot" title="已自定义"></span>
              <el-icon class="opt-group-chevron"><ArrowDown /></el-icon>
            </div>
            <div class="form-grid" v-show="isGroupOpen('log')">
              <el-form-item>
                <template #label><span class="opt-label">日志文件<el-tooltip placement="auto" :content="tips.logFile" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.logFile" placeholder="留空=控制台输出" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">日志级别<span class="opt-default">默认 info</span><el-tooltip placement="auto" :content="tips.logLevel" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-select v-model="form.logLevel" @change="onFormChange">
                  <el-option label="trace" value="trace" />
                  <el-option label="debug" value="debug" />
                  <el-option label="info" value="info" />
                  <el-option label="warn" value="warn" />
                  <el-option label="error" value="error" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">保留天数<span class="opt-default">默认 3</span><el-tooltip placement="auto" :content="tips.logMaxDays" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.logMaxDays" placeholder="天，0=不自动删除" @input="onFormChange" />
              </el-form-item>
            </div>
          </div>

          <!-- 监控服务 -->
          <div class="opt-group" :class="{ 'opt-group-open': isGroupOpen('metrics') }">
            <div class="opt-group-header opt-group-header-click" @click="toggleGroup('metrics')">
              <el-icon class="opt-group-icon"><Connection /></el-icon>
              <span class="opt-group-title">监控服务（metricsServer）</span>
              <span v-if="groupHasValue.metrics" class="opt-group-dot" title="已自定义"></span>
              <el-icon class="opt-group-chevron"><ArrowDown /></el-icon>
            </div>
            <div class="form-grid" v-show="isGroupOpen('metrics')">
              <el-form-item>
                <template #label><span class="opt-label">监听地址<span class="opt-default">默认 127.0.0.1</span><el-tooltip placement="auto" :content="tips.metricsAddr" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.metricsAddr" placeholder="127.0.0.1" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">端口<el-tooltip placement="auto" :content="tips.metricsPort" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.metricsPort" placeholder="0=不启动" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">用户名<el-tooltip content='Basic Auth 用户名，保护 /metrics 与 pprof；/healthz 保持匿名。' placement="auto" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.metricsUser" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">密码<el-tooltip content='Basic Auth 密码。建议设置，否则 metrics 会暴露内网信息。' placement="auto" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.metricsPassword" type="password" show-password @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">启用 pprof<span class="opt-default">默认 false</span><el-tooltip placement="auto" :content="tips.metricsPprof" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-switch v-model="form.metricsPprofEnable" @change="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">TLS 证书<el-tooltip content='与 TLS 密钥成对使用，启用后监控服务以 HTTPS 提供。' placement="auto" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.metricsTlsCertFile" placeholder="可选" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">TLS 密钥<el-tooltip content='与 TLS 证书成对使用。' placement="auto" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.metricsTlsKeyFile" placeholder="可选" @input="onFormChange" />
              </el-form-item>
            </div>
          </div>

          <!-- 高级选项 -->
          <div class="opt-group" :class="{ 'opt-group-open': isGroupOpen('advanced') }">
            <div class="opt-group-header opt-group-header-click" @click="toggleGroup('advanced')">
              <el-icon class="opt-group-icon"><Setting /></el-icon>
              <span class="opt-group-title">高级选项</span>
              <span v-if="groupHasValue.advanced" class="opt-group-dot" title="已自定义"></span>
              <el-icon class="opt-group-chevron"><ArrowDown /></el-icon>
            </div>
            <div class="form-grid" v-show="isGroupOpen('advanced')">
              <el-form-item>
                <template #label><span class="opt-label">STUN 服务器<el-tooltip placement="auto" :content="tips.natHoleStunServer" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.natHoleStunServer" placeholder="stun.easyvoip.com:3478" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">UDP 包大小<span class="opt-default">默认 1500</span><el-tooltip placement="auto" :content="tips.udpPacketSize" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.udpPacketSize" placeholder="字节，默认 1500" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">启用代理名单<span class="opt-default">默认全部启用</span><el-tooltip placement="auto" :content="tips.start" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <StringListEditor v-model="form.start" placeholder="代理名称" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">包含配置文件<el-tooltip placement="auto" :content="tips.includes" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <StringListEditor v-model="form.includes" placeholder="./proxies/*.toml" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">客户端元数据<el-tooltip placement="auto" :content="tips.clientMetadatas" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <KeyValueEditor v-model="form.metadatas" key-placeholder="key" value-placeholder="value" @update:model-value="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">Feature Gates<el-tooltip placement="auto" :content="tips.featureGates" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <KeyValueEditor v-model="form.featureGates" key-placeholder="特性名" value-placeholder="true / false" @update:model-value="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">虚拟网络地址<el-tooltip placement="auto" :content="tips.virtualNet" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.virtualNetAddress" placeholder="如 192.168.66.x" @input="onFormChange" />
              </el-form-item>
              <el-form-item>
                <template #label><span class="opt-label">Store 文件路径<el-tooltip placement="auto" :content="tips.storePath" :show-after="0" raw-content><el-icon class="tip-icon"><QuestionFilled /></el-icon></el-tooltip></span></template>
                <el-input v-model="form.storePath" placeholder="./frpc_store.toml" @input="onFormChange" />
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

    <el-dialog v-model="proxyDialogVisible" :title="editingIndex >= 0 ? '编辑代理' : '添加代理'" :width="isMobile ? '100%' : '520px'" :fullscreen="isMobile" :close-on-click-modal="false" :close-on-press-escape="false" destroy-on-close :append-to-body="true">
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
import { Link, QuestionFilled, Connection, Setting, Lock, User, View, Edit, Delete, ArrowDown } from '@element-plus/icons-vue'
import { useClientStore } from '../stores/client'
import { useConnectionStore } from '../stores/connection'
import ActionButton from '@shared/components/ActionButton.vue'
import ConfirmDialog from '@shared/components/ConfirmDialog.vue'
import StringListEditor from '../components/StringListEditor.vue'
import KeyValueEditor from '../components/KeyValueEditor.vue'
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

// ===== 分组折叠：默认值未改动则折叠，有自定义值自动展开 =====
const groupExpanded = reactive<Record<string, boolean>>({})

const groupHasValue = computed<Record<string, boolean>>(() => ({
  serverPort: form.serverPort !== '',
  transportAdv:
    [form.tcpMuxKeepaliveInterval, form.dialServerKeepalive, form.dialServerTimeout,
     form.poolCount, form.wireProtocol, form.connectServerLocalIP, form.proxyURL,
     form.heartbeatInterval, form.heartbeatTimeout].some((v) => v !== ''),
  quic:
    [form.quicKeepalivePeriod, form.quicMaxIdleTimeout, form.quicMaxIncomingStreams,
     form.poolCount].some((v) => v !== ''),
  tls:
    !form.tlsEnable || !form.tlsDisableCustomFirstByte ||
    form.tlsCertFile !== '' || form.tlsKeyFile !== '' ||
    form.tlsTrustedCaFile !== '' || form.tlsUseSystemCa || form.tlsServerName !== '',
  web:
    form.webAddr !== '0.0.0.0' || form.webPort !== '' || form.webUser !== '' ||
    form.webPassword !== '' || form.webTlsCertFile !== '' || form.webTlsKeyFile !== '',
  log: form.logFile !== '' || form.logLevel !== 'info' || form.logMaxDays !== '',
  metrics:
    form.metricsAddr !== '' || form.metricsPort !== '' || form.metricsUser !== '' ||
    form.metricsPassword !== '' || form.metricsPprofEnable ||
    form.metricsTlsCertFile !== '' || form.metricsTlsKeyFile !== '',
  advanced:
    form.natHoleStunServer !== '' || form.udpPacketSize !== '' ||
    form.start.length > 0 || form.includes.length > 0 ||
    form.metadatas.length > 0 || form.featureGates.length > 0 ||
    form.virtualNetAddress !== '' || form.storePath !== '',
}))

const isGroupOpen = (id: string) => groupExpanded[id] ?? (groupHasValue.value[id] ?? false)
const toggleGroup = (id: string) => { groupExpanded[id] = !isGroupOpen(id) }
const resetGroupState = () => { Object.keys(groupExpanded).forEach((k) => delete groupExpanded[k]) }
const connMode = ref<'tcpMux' | 'tcpNoMux' | 'quic'>('tcpMux')

const tips = {
  serverAddr: 'frps 服务器的 IP 或域名。默认 "0.0.0.0"。必填项。',
  serverPort: 'frps 服务器端口。默认 7000。大部分场景无需修改。',
  clientUser: '用户名前缀（user）。设置后所有代理名称自动变为 "{user}.{代理名}"，用于多客户端共用一个 frps 时区分归属。对应配置文件根级 user 字段。',
  clientID: '客户端唯一标识（clientID）。用于在服务端区分不同的 frpc 实例。留空则自动生成。一般无需填写。',
  dnsServer: 'frpc 使用的 DNS 服务器地址。留空使用系统默认 DNS。仅影响 frpc 自身解析（如 serverAddr 为域名时）。',
  loginFailExit: '登录失败退出（loginFailExit）。开启：首次连不上 frps 直接退出进程；关闭：持续重试直到成功。systemd/Docker 环境建议开启（配合自动重启）。默认 true。',
  authMethod: '认证方式。token：使用共享密钥（默认）；oidc：通过 OIDC（OpenID Connect）向身份提供商获取短期令牌，适合需要更高安全性的场景。',
  authToken: 'Token 认证密钥，必须与服务端 auth.token 完全一致。认证方式默认 "token"。无默认值，必填。',
  authTokenSource: '令牌来源。静态值：直接填密钥；从文件读取：frpc 启动时从文件加载（tokenSource.type = file，可配合脚本动态更新）；从命令获取：执行命令取 stdout 作为令牌（tokenSource.type = exec）。',
  authTokenFile: '令牌文件路径。frpc 从此文件读取令牌内容（文件内即令牌字符串本身）。与静态令牌互斥。',
  authTokenCommand: '获取令牌的命令。frpc 执行此命令并取标准输出作为令牌，适合对接 Vault 等动态密钥系统。',
  authAdditionalScopes: '附加认证范围。让心跳（HeartBeats）和新工作连接（NewWorkConns）也携带认证信息。默认仅登录时认证。',
  oidcClientID: 'OIDC Client ID。向身份提供商注册的应用 ID。',
  oidcClientSecret: 'OIDC Client Secret。与 Client ID 配对的应用密钥。',
  oidcAudience: 'OIDC Audience。令牌的受众声明，部分 IdP（如 Keycloak）必填。',
  oidcScope: 'OIDC Scope。请求的权限范围，如 "openid profile"。留空使用 IdP 默认值。',
  oidcTokenEndpointURL: 'OIDC Token Endpoint URL。身份提供商签发令牌的地址，如 https://idp.example.com/realms/frp/protocol/openid-connect/token。',
  oidcTrustedCaFile: '自定义 CA 证书路径。用于验证 OIDC Token Endpoint 的 TLS 证书（自建 CA 时填写）。',
  oidcInsecureSkipVerify: '跳过 OIDC Endpoint 的 TLS 证书校验。仅调试使用，生产环境不要开启。',
  oidcProxyURL: '访问 OIDC Endpoint 使用的代理。支持 http/https/socks5/socks5h，留空直连。内网 frpc 需经代理访问外网 IdP 时填写。',
  oidcAdditionalEndpointParams: '附加 Endpoint 参数。请求令牌时额外发送的参数键值对。',
  transportProtocol: 'frpc 连接 frps 的传输协议。TCP（默认）；KCP：基于 UDP，需要 frps 开启 kcpPort，延迟更低；WebSocket/WSS：可穿过仅允许 HTTP 的防火墙/CDN。QUIC 通过上方模式卡片选择。',
  protocol: '传输协议。QUIC 模式下固定为 "quic"，基于 UDP 传输，原生支持多路复用和连接迁移。',
  tcpMux: '是否开启 yamux 多路复用。true=所有控制/工作连接共享 1 条 TCP；false=每条连接独立 TCP。默认 true。<br/><br/>TCPMux 模式下，yamux 每 30s 发送一次 ping 保活，只要 yamux session 存活，所有 work conn stream 就不会被 NAT/防火墙断开。关闭后工作连接建立后完全静默，无任何应用层保活（控制连接仍有 30s 心跳），需依赖 OS TCP keepalive。',
  tcpMuxKeepaliveInterval: 'yamux session 保活 ping 间隔（秒）。yamux 每隔 N 秒发送一次 ping 帧，维持底层 TCP 有流量，防止中间 NAT/防火墙因"空闲超时"丢弃连接。<br/><br/>默认 30s，远低于常见 NAT 空闲超时（60~300s），连接永远不会被误杀。调小可对抗短超时 NAT（如 60s 阈值时设 15s）；调大可减少无效通信。本模式实际保活就靠这一项。<br/><br/>仅在 tcpMux=true 时生效。',
  tcpKeepalive: 'OS 级 TCP keepalive 间隔（秒）。TCP 连接空闲超过此时长后，操作系统发送 keepalive 探测包判断连接是否存活。<br/><br/>默认 7200s（2 小时），远大于常见 NAT 空闲超时（60~300s），所以直连模式下必须调小到 60s 左右。注意：这不是"主动保活"而是"缩短断连检测延迟"。<br/><br/>TCPMux 模式下 yamux 每 30s 通信一次，TCP 空闲绝不超过 30s，OS keepalive 永远不会触发，不写也不影响。',
  poolCount: '连接池大小。frpc 预先向 frps 建立的工作连接数。<br/><br/>TCPMux 模式默认 1，加大可减少新用户连接等待时间。直连模式下加大池可加速轮转，减少单连接闲置时间从而降低被 NAT 断开概率。QUIC 模式建议 ≥3，因为 stream 建立几乎无开销。<br/><br/>取值范围 1~maxPoolCount（服务端）。',
  dialServerTimeout: '客户端连接 frps 的拨号超时（秒）。默认 10。通常无需调整。仅在网络延迟极高的场景适当调大。',
  wireProtocol: 'frpc/frps 内部通信协议版本。默认 v1，可选 v2。仅在服务端也启用 v2 时修改。一般无需配置。',
  connectServerLocalIP: '连接 frps 时本地绑定的 IP 地址。多网卡/多出口环境指定走哪个网卡。仅 TCP/WebSocket 协议支持，KCP 不支持。留空由系统路由决定。',
  proxyURL: '连接 frps 使用的 HTTP 代理地址，如 http://proxy:7890。留空直连（且不再读取 http_proxy 环境变量）。frpc 在内网、frps 在公网时常用。',
  tlsEnable: '是否启用 TLS 传输加密。默认 true。<br/><br/>QUIC 协议强制要求 TLS 1.3，必须保持 true。其它模式下关闭仅用于内网测试环境（不推荐）。',
  disableCustomTLSFirstByte: '是否禁用自定义 TLS 首字节协议协商。默认 true（禁用），使用标准 TLS 握手。仅当 frps 使用了 frp 自定义的 TLS 首字节时设为 false。一般不需要修改。',
  tlsCertFile: 'TLS 客户端证书文件路径。仅 mTLS（双向认证）场景使用，普通 token 认证无需填写。QUIC 下服务端必须提供证书。',
  tlsKeyFile: 'TLS 客户端密钥文件路径。仅 mTLS 场景使用，配合证书文件一起使用。普通场景留空。',
  tlsTrustedCaFile: '受信 CA 证书路径（transport.tls.trustedCaFile）。mTLS 场景验证 frps 服务端证书。设置后不再使用系统 CA。与"使用系统 CA"可同时使用。',
  tlsUseSystemCa: '使用系统 CA 校验 frps 证书（transport.tls.useSystemCa）。同时设置受信 CA 时，自定义 CA 会加入系统 CA 池。两者都不设时 frpc 跳过验证。',
  tlsServerName: 'TLS SNI（Server Name Indication）服务器名称。用于 TLS 握手时的域名验证。留空则使用 serverAddr 的值。',
  quicKeepalivePeriod: 'QUIC PING 帧发送间隔（秒）。quic-go 每隔 N 秒发送一个 PING 帧保持连接活跃。\n\nUDP 不像 TCP 有面向连接的状态，NAT 设备需要看到持续流量才不丢弃 UDP 映射。默认 10s 已覆盖绝大多数场景。如果 NAT 环境极度恶劣可设 5s。',
  quicMaxIdleTimeout: 'QUIC 连接空闲断连超时（秒）。连接连续空闲 N 秒（无任何帧，含 PING 帧）后自动关闭。默认 30s。\n\n正常情况下 keepalivePeriod（10s）< maxIdleTimeout（30s），保活 PING 阻止超时触发。若 PING 发送失败，最多 30s 后断连并触发重连。',
  quicMaxIncomingStreams: 'QUIC 最大并发流数。默认 100000。一般不需要修改，除非需要限制并发代理连接数。',
  webAddr: '管理面板监听地址（webServer.addr）。0.0.0.0=允许其他机器访问（远程管理）；127.0.0.1=仅本机访问，更安全。默认 0.0.0.0。',
  webUser: 'Dashboard 管理面板登录用户名。配合下方密码和端口使用。webServer.port 默认 0（不启动），需手动设置端口。',
  webPassword: 'Dashboard 管理面板登录密码。搭配上方用户名使用。',
  webTlsCert: '管理面板 HTTPS 证书路径（webServer.tls.certFile）。设置后面板以 HTTPS 服务，配合密钥使用。',
  metricsAddr: '监控服务监听地址（metricsServer.addr）。默认 127.0.0.1 仅本机访问；0.0.0.0 允许远程采集（务必配密码）。',
  metricsPort: '监控服务端口（metricsServer.port）。提供 /healthz（匿名）、/metrics 与 pprof（需认证）。0=不启动。与 webServer 独立，不提供 Web 界面。',
  metricsPprof: '在监控服务上启用 Go pprof 性能分析端点（如 /debug/pprof/）。仅排查性能问题时临时开启。',
  natHoleStunServer: 'STUN 服务器地址（xtcp 打洞用）。格式 host:port，默认 stun.easyvoip.com:3478。仅在 xtcp 代理打洞时使用。',
  udpPacketSize: 'UDP 单个数据包最大字节数。默认 1500（常见 MTU）。仅在转发大 UDP 包（如游戏、视频）出现丢包截断时调整。',
  start: '启用代理名单（start）。列出要启动的代理名称；留空=启用配置中所有代理。与每个代理自身的"启用"开关共同生效（取交集）。',
  includes: '包含其他配置文件（includes）。把额外的 TOML 文件合并进来，常用于把代理配置拆分到独立文件、或一个 frpc 服务多个用户配置。支持相对路径与 glob。',
  clientMetadatas: '客户端元数据（metadatas）。附加信息随登录发送给 frps，可被服务端插件读取做权限控制。frps 需配置对应 metadata 校验才有意义。',
  featureGates: '功能开关（featureGates）。启用或禁用 frp 的实验性/灰度特性，值为 true/false。如 VirtualNet = true。日常使用无需填写。',
  virtualNet: '虚拟网络地址（virtualNet.address）。启用 frp 虚拟网卡（TUN）功能时配置，需配合 root 权限运行。普通场景留空。',
  storePath: 'Store 文件路径（store.path）。frpc 内置的配置存储源，代理/访客的增删改保存于此 JSON 文件，本面板的"代理管理"依赖它。修改后需重启 frpc 生效。',
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
  prevDialogType = 'tcp'
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
  prevDialogType = t
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
  // 客户端标识
  clientUser: '',
  clientID: '',
  dnsServer: '',
  loginFailExit: true,
  // 认证
  authMethod: 'token',
  authToken: '',
  authTokenSourceKind: 'static' as 'static' | 'file' | 'exec',
  authTokenFile: '',
  authTokenCommand: '',
  authTokenCommandArgs: [] as string[],
  authAdditionalScopes: [] as string[],
  oidcClientID: '',
  oidcClientSecret: '',
  oidcAudience: '',
  oidcScope: '',
  oidcTokenEndpointURL: '',
  oidcTrustedCaFile: '',
  oidcInsecureSkipVerify: false,
  oidcProxyURL: '',
  oidcAdditionalEndpointParams: [] as Array<{ key: string; value: string }>,
  // 传输
  transportProtocol: '',
  tcpMux: true,
  tcpMuxKeepaliveInterval: '',
  dialServerKeepalive: '',
  dialServerTimeout: '',
  heartbeatInterval: '',
  heartbeatTimeout: '',
  poolCount: '',
  wireProtocol: '',
  connectServerLocalIP: '',
  proxyURL: '',
  tlsEnable: true,
  tlsDisableCustomFirstByte: true,
  tlsCertFile: '',
  tlsKeyFile: '',
  tlsTrustedCaFile: '',
  tlsUseSystemCa: false,
  tlsServerName: '',
  quicKeepalivePeriod: '',
  quicMaxIdleTimeout: '',
  quicMaxIncomingStreams: '',
  // 管理面板（webServer）
  webAddr: '0.0.0.0',
  webPort: '',
  webUser: '',
  webPassword: '',
  webTlsCertFile: '',
  webTlsKeyFile: '',
  // 监控服务（metricsServer）
  metricsAddr: '',
  metricsPort: '',
  metricsUser: '',
  metricsPassword: '',
  metricsPprofEnable: false,
  metricsTlsCertFile: '',
  metricsTlsKeyFile: '',
  // 日志
  logFile: '',
  logLevel: 'info',
  logMaxDays: '',
  // 高级
  natHoleStunServer: '',
  udpPacketSize: '',
  start: [] as string[],
  includes: [] as string[],
  metadatas: [] as Array<{ key: string; value: string }>,
  featureGates: [] as Array<{ key: string; value: string }>,
  virtualNetAddress: '',
  storePath: '',
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

const kvToMap = (entries: Array<{ key: string; value: string }>): Record<string, any> => {
  const out: Record<string, any> = {}
  for (const e of entries) {
    if (e.key) out[e.key] = e.value
  }
  return out
}

// 表单接管的根级键（表单清空时从配置中移除）
const FORM_OWNED_ROOT_KEYS = [
  'serverAddr', 'serverPort', 'user', 'clientID', 'dnsServer', 'loginFailExit',
  'natHoleStunServer', 'udpPacketSize', 'start', 'includes',
]

// 表单接管的节及键；null = 整节由表单全量接管
const FORM_OWNED_SECTION_KEYS: Record<string, string[] | null> = {
  auth: [
    'method', 'token', 'additionalScopes',
    'tokenSource.type', 'tokenSource.file.path', 'tokenSource.exec.command', 'tokenSource.exec.args',
    'oidc.clientID', 'oidc.clientSecret', 'oidc.audience', 'oidc.scope', 'oidc.tokenEndpointURL',
    'oidc.trustedCaFile', 'oidc.insecureSkipVerify', 'oidc.proxyURL', 'oidc.additionalEndpointParams',
  ],
  transport: [
    'protocol', 'tcpMux', 'tcpMuxKeepaliveInterval', 'dialServerKeepalive', 'dialServerTimeout',
    'poolCount', 'wireProtocol', 'heartbeatInterval', 'heartbeatTimeout', 'connectServerLocalIP', 'proxyURL',
    'tls.enable', 'tls.disableCustomTLSFirstByte', 'tls.certFile', 'tls.keyFile', 'tls.serverName',
    'tls.trustedCaFile', 'tls.useSystemCa',
    'quic.keepalivePeriod', 'quic.maxIdleTimeout', 'quic.maxIncomingStreams',
  ],
  webServer: ['addr', 'port', 'user', 'password', 'tls.certFile', 'tls.keyFile'],
  metricsServer: ['addr', 'port', 'user', 'password', 'pprofEnable', 'tls.certFile', 'tls.keyFile'],
  log: ['to', 'level', 'maxDays'],
  metadatas: null,
  featureGates: null,
  virtualNet: null,
  store: null,
}

// 表单生成父节时需移除的冲突子表（数据已由表单字段表达，避免 TOML 重复表定义）
const FORM_OWNED_SUBSECTIONS: Record<string, RegExp> = {
  auth: /^auth\.(oidc|tokenSource)$/i,
  transport: /^transport\.(tls|quic)$/i,
  webServer: /^webServer\.tls$/i,
  metricsServer: /^metricsServer\.tls$/i,
}

// 规范节顺序（表单生成时节名的固定顺序）
const CANONICAL_SECTIONS = [
  'auth', 'transport', 'webServer', 'metricsServer', 'log',
  'metadatas', 'featureGates', 'virtualNet', 'store',
]

const findSectionKey = (sections: Record<string, Record<string, any>>, name: string): string | undefined => {
  const lower = name.toLowerCase()
  return Object.keys(sections).find((k) => k.toLowerCase() === lower)
}

const writeTlsKeys = (tr: Record<string, any>) => {
  if (form.tlsCertFile) tr['tls.certFile'] = form.tlsCertFile
  if (form.tlsKeyFile) tr['tls.keyFile'] = form.tlsKeyFile
  if (form.tlsTrustedCaFile) tr['tls.trustedCaFile'] = form.tlsTrustedCaFile
  if (form.tlsUseSystemCa) tr['tls.useSystemCa'] = true
  if (form.tlsServerName) tr['tls.serverName'] = form.tlsServerName
}

const formToConfig = (): FrpcConfig => {
  const roots: Record<string, any> = {}
  const sections: Record<string, Record<string, any>> = {}
  const order: string[] = []

  if (form.serverAddr) roots['serverAddr'] = form.serverAddr
  if (form.serverPort) roots['serverPort'] = Number(form.serverPort)
  if (form.clientUser) roots['user'] = form.clientUser
  if (form.clientID) roots['clientID'] = form.clientID
  if (form.dnsServer) roots['dnsServer'] = form.dnsServer
  if (!form.loginFailExit) roots['loginFailExit'] = false
  if (form.natHoleStunServer) roots['natHoleStunServer'] = form.natHoleStunServer
  if (form.udpPacketSize) roots['udpPacketSize'] = Number(form.udpPacketSize)
  if (form.start.length > 0) roots['start'] = [...form.start]
  if (form.includes.length > 0) roots['includes'] = [...form.includes]

  // Auth
  if (form.authMethod === 'oidc') {
    const auth: Record<string, any> = { method: 'oidc' }
    if (form.oidcClientID) auth['oidc.clientID'] = form.oidcClientID
    if (form.oidcClientSecret) auth['oidc.clientSecret'] = form.oidcClientSecret
    if (form.oidcAudience) auth['oidc.audience'] = form.oidcAudience
    if (form.oidcScope) auth['oidc.scope'] = form.oidcScope
    if (form.oidcTokenEndpointURL) auth['oidc.tokenEndpointURL'] = form.oidcTokenEndpointURL
    if (form.oidcTrustedCaFile) auth['oidc.trustedCaFile'] = form.oidcTrustedCaFile
    if (form.oidcInsecureSkipVerify) auth['oidc.insecureSkipVerify'] = true
    if (form.oidcProxyURL) auth['oidc.proxyURL'] = form.oidcProxyURL
    const params = kvToMap(form.oidcAdditionalEndpointParams)
    if (Object.keys(params).length > 0) auth['oidc.additionalEndpointParams'] = params
    if (form.authAdditionalScopes.length > 0) auth['additionalScopes'] = [...form.authAdditionalScopes]
    sections['auth'] = auth
    order.push('__section:auth')
  } else if (
    (form.authTokenSourceKind === 'static' && form.authToken) ||
    (form.authTokenSourceKind === 'file' && form.authTokenFile) ||
    (form.authTokenSourceKind === 'exec' && form.authTokenCommand) ||
    form.authAdditionalScopes.length > 0
  ) {
    const auth: Record<string, any> = { method: 'token' }
    if (form.authTokenSourceKind === 'static') {
      if (form.authToken) auth['token'] = form.authToken
    } else if (form.authTokenSourceKind === 'file') {
      auth['tokenSource.type'] = 'file'
      if (form.authTokenFile) auth['tokenSource.file.path'] = form.authTokenFile
    } else {
      auth['tokenSource.type'] = 'exec'
      if (form.authTokenCommand) auth['tokenSource.exec.command'] = form.authTokenCommand
      if (form.authTokenCommandArgs.length > 0) {
        auth['tokenSource.exec.args'] = [...form.authTokenCommandArgs]
      }
    }
    if (form.authAdditionalScopes.length > 0) auth['additionalScopes'] = [...form.authAdditionalScopes]
    sections['auth'] = auth
    order.push('__section:auth')
  }

  if (connMode.value === 'quic') {
    const tr: Record<string, any> = { protocol: 'quic' }
    if (form.poolCount && !isDefault('transport.poolCount', form.poolCount)) tr['poolCount'] = Number(form.poolCount)
    if (form.tlsEnable || connMode.value === 'quic') {
      tr['tls.enable'] = true
      if (!isDefault('transport.tls.disableCustomTLSFirstByte', form.tlsDisableCustomFirstByte)) tr['tls.disableCustomTLSFirstByte'] = form.tlsDisableCustomFirstByte
      writeTlsKeys(tr)
    }
    if (form.quicKeepalivePeriod && !isDefault('transport.quic.keepalivePeriod', form.quicKeepalivePeriod)) tr['quic.keepalivePeriod'] = Number(form.quicKeepalivePeriod)
    if (form.quicMaxIdleTimeout && !isDefault('transport.quic.maxIdleTimeout', form.quicMaxIdleTimeout)) tr['quic.maxIdleTimeout'] = Number(form.quicMaxIdleTimeout)
    if (form.quicMaxIncomingStreams && !isDefault('transport.quic.maxIncomingStreams', form.quicMaxIncomingStreams)) tr['quic.maxIncomingStreams'] = Number(form.quicMaxIncomingStreams)
    sections['transport'] = tr
    order.push('__section:transport')
  } else {
    const tr: Record<string, any> = {}
    if (form.transportProtocol) tr['protocol'] = form.transportProtocol
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
    if (form.connectServerLocalIP) tr['connectServerLocalIP'] = form.connectServerLocalIP
    if (form.proxyURL) tr['proxyURL'] = form.proxyURL
    if (form.tlsEnable) {
      tr['tls.enable'] = true
      if (!isDefault('transport.tls.disableCustomTLSFirstByte', form.tlsDisableCustomFirstByte)) tr['tls.disableCustomTLSFirstByte'] = form.tlsDisableCustomFirstByte
      writeTlsKeys(tr)
    } else {
      // 显式关闭 TLS（v0.50.0 起默认启用，必须显式写 false）
      tr['tls.enable'] = false
    }
    sections['transport'] = tr
    order.push('__section:transport')
  }

  if (form.webPort || form.webUser || form.webPassword || form.webTlsCertFile) {
    const ws: Record<string, any> = {}
    ws['addr'] = form.webAddr || '0.0.0.0'
    if (form.webPort) ws['port'] = Number(form.webPort)
    if (form.webUser) ws['user'] = form.webUser
    if (form.webPassword) ws['password'] = form.webPassword
    if (form.webTlsCertFile) ws['tls.certFile'] = form.webTlsCertFile
    if (form.webTlsKeyFile) ws['tls.keyFile'] = form.webTlsKeyFile
    sections['webServer'] = ws
    order.push('__section:webServer')
  }

  if (form.metricsPort || form.metricsAddr || form.metricsUser || form.metricsPassword || form.metricsPprofEnable || form.metricsTlsCertFile) {
    const ms: Record<string, any> = {}
    if (form.metricsAddr) ms['addr'] = form.metricsAddr
    if (form.metricsPort) ms['port'] = Number(form.metricsPort)
    if (form.metricsUser) ms['user'] = form.metricsUser
    if (form.metricsPassword) ms['password'] = form.metricsPassword
    if (form.metricsPprofEnable) ms['pprofEnable'] = true
    if (form.metricsTlsCertFile) ms['tls.certFile'] = form.metricsTlsCertFile
    if (form.metricsTlsKeyFile) ms['tls.keyFile'] = form.metricsTlsKeyFile
    sections['metricsServer'] = ms
    order.push('__section:metricsServer')
  }

  const lg: Record<string, any> = {}
  if (form.logFile) lg['to'] = form.logFile
  if (form.logLevel && form.logLevel !== 'info') lg['level'] = form.logLevel
  if (form.logMaxDays) lg['maxDays'] = Number(form.logMaxDays)
  if (Object.keys(lg).length > 0) {
    sections['log'] = lg
    order.push('__section:log')
  }

  const metadataMap = kvToMap(form.metadatas)
  if (Object.keys(metadataMap).length > 0) {
    sections['metadatas'] = metadataMap
    order.push('__section:metadatas')
  }

  const gateMap: Record<string, any> = {}
  for (const e of form.featureGates) {
    if (!e.key) continue
    gateMap[e.key] = e.value === 'true' || e.value === 'false' ? e.value === 'true' : e.value
  }
  if (Object.keys(gateMap).length > 0) {
    sections['featureGates'] = gateMap
    order.push('__section:featureGates')
  }

  if (form.virtualNetAddress) {
    sections['virtualNet'] = { address: form.virtualNetAddress }
    order.push('__section:virtualNet')
  }

  if (form.storePath) {
    sections['store'] = { path: form.storePath }
    order.push('__section:store')
  }

  return { roots, sections, proxies: [], visitors: [], order }
}

const toStrList = (v: any): string[] => {
  if (Array.isArray(v)) return v.map(String)
  if (v != null && v !== '') return [String(v)]
  return []
}

const toKvEntries = (obj: Record<string, any> | undefined): Array<{ key: string; value: string }> => {
  if (!obj) return []
  return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }))
}

// 优先读父节的点号键（tls.enable），其次读子表（[transport.tls] enable）
const readSecVal = (cfg: FrpcConfig, secName: string, key: string): any => {
  const parent = getSection(cfg.sections, secName)
  const v = getVal(parent, key)
  if (v !== undefined) return v
  const dotIdx = key.indexOf('.')
  if (dotIdx > 0) {
    const sub = getSection(cfg.sections, `${secName}.${key.slice(0, dotIdx)}`)
    return getVal(sub, key.slice(dotIdx + 1))
  }
  return undefined
}

const applyParsedToForm = (cfg: FrpcConfig) => {
  form.serverAddr = getVal(cfg.roots, 'serverAddr') || ''
  form.serverPort = getVal(cfg.roots, 'serverPort') != null ? String(getVal(cfg.roots, 'serverPort')) : ''
  form.clientUser = getVal(cfg.roots, 'user') || ''
  form.clientID = getVal(cfg.roots, 'clientID') || ''
  form.dnsServer = getVal(cfg.roots, 'dnsServer') || ''
  form.loginFailExit = getVal(cfg.roots, 'loginFailExit') !== false
  form.natHoleStunServer = getVal(cfg.roots, 'natHoleStunServer') || ''
  form.udpPacketSize = getVal(cfg.roots, 'udpPacketSize') != null ? String(getVal(cfg.roots, 'udpPacketSize')) : ''
  form.start = toStrList(getVal(cfg.roots, 'start'))
  form.includes = toStrList(getVal(cfg.roots, 'includes'))
  form.metadatas = toKvEntries(getSection(cfg.sections, 'metadatas'))
  form.virtualNetAddress = getVal(getSection(cfg.sections, 'virtualNet'), 'address') || ''
  form.storePath = getVal(getSection(cfg.sections, 'store'), 'path') || ''

  const gates = getSection(cfg.sections, 'featureGates')
  form.featureGates = toKvEntries(gates)

  const authVal = (key: string) => readSecVal(cfg, 'auth', key)
  const authMethod = authVal('method') || 'token'
  form.authMethod = authMethod === 'oidc' ? 'oidc' : 'token'
  form.authToken = authVal('token') || ''
  const tsType = authVal('tokenSource.type')
  if (tsType === 'file') {
    form.authTokenSourceKind = 'file'
    form.authTokenFile = authVal('tokenSource.file.path') || ''
  } else if (tsType === 'exec') {
    form.authTokenSourceKind = 'exec'
    form.authTokenCommand = authVal('tokenSource.exec.command') || ''
    form.authTokenCommandArgs = toStrList(authVal('tokenSource.exec.args'))
  } else {
    form.authTokenSourceKind = 'static'
  }
  form.authAdditionalScopes = toStrList(authVal('additionalScopes'))
  form.oidcClientID = authVal('oidc.clientID') || ''
  form.oidcClientSecret = authVal('oidc.clientSecret') || ''
  form.oidcAudience = authVal('oidc.audience') || ''
  form.oidcScope = authVal('oidc.scope') || ''
  form.oidcTokenEndpointURL = authVal('oidc.tokenEndpointURL') || ''
  form.oidcTrustedCaFile = authVal('oidc.trustedCaFile') || ''
  form.oidcInsecureSkipVerify = authVal('oidc.insecureSkipVerify') === true
  form.oidcProxyURL = authVal('oidc.proxyURL') || ''
  form.oidcAdditionalEndpointParams = toKvEntries(authVal('oidc.additionalEndpointParams'))

  const tr = getSection(cfg.sections, 'transport')
  if (tr) {
    const trVal = (key: string) => readSecVal(cfg, 'transport', key)
    const protocol = trVal('protocol') || ''
    if (protocol === 'quic') connMode.value = 'quic'
    else if (getVal(tr, 'tcpMux') === false) connMode.value = 'tcpNoMux'
    else connMode.value = 'tcpMux'
    form.transportProtocol = protocol === 'quic' ? '' : protocol

    form.tcpMux = getVal(tr, 'tcpMux') !== false
    form.tcpMuxKeepaliveInterval = getVal(tr, 'tcpMuxKeepaliveInterval') != null ? String(getVal(tr, 'tcpMuxKeepaliveInterval')) : ''
    form.dialServerKeepalive = getVal(tr, 'dialServerKeepalive') != null ? String(getVal(tr, 'dialServerKeepalive')) : ''
    form.dialServerTimeout = getVal(tr, 'dialServerTimeout') != null ? String(getVal(tr, 'dialServerTimeout')) : ''
    form.heartbeatInterval = getVal(tr, 'heartbeatInterval') != null ? String(getVal(tr, 'heartbeatInterval')) : ''
    form.heartbeatTimeout = getVal(tr, 'heartbeatTimeout') != null ? String(getVal(tr, 'heartbeatTimeout')) : ''
    form.poolCount = getVal(tr, 'poolCount') != null ? String(getVal(tr, 'poolCount')) : ''
    form.wireProtocol = getVal(tr, 'wireProtocol') || ''
    form.connectServerLocalIP = getVal(tr, 'connectServerLocalIP') || ''
    form.proxyURL = getVal(tr, 'proxyURL') || ''

    form.tlsEnable = trVal('tls.enable') !== false || protocol === 'quic'
    form.tlsDisableCustomFirstByte = trVal('tls.disableCustomTLSFirstByte') !== false
    form.tlsCertFile = trVal('tls.certFile') || ''
    form.tlsKeyFile = trVal('tls.keyFile') || ''
    form.tlsTrustedCaFile = trVal('tls.trustedCaFile') || ''
    form.tlsUseSystemCa = trVal('tls.useSystemCa') === true
    form.tlsServerName = trVal('tls.serverName') || ''

    form.quicKeepalivePeriod = trVal('quic.keepalivePeriod') != null ? String(trVal('quic.keepalivePeriod')) : ''
    form.quicMaxIdleTimeout = trVal('quic.maxIdleTimeout') != null ? String(trVal('quic.maxIdleTimeout')) : ''
    form.quicMaxIncomingStreams = trVal('quic.maxIncomingStreams') != null ? String(trVal('quic.maxIncomingStreams')) : ''
  }

  const wsVal = (key: string) => readSecVal(cfg, 'webServer', key)
  form.webAddr = wsVal('addr') || '0.0.0.0'
  form.webPort = wsVal('port') != null ? String(wsVal('port')) : ''
  form.webUser = wsVal('user') || ''
  form.webPassword = wsVal('password') || ''
  form.webTlsCertFile = wsVal('tls.certFile') || ''
  form.webTlsKeyFile = wsVal('tls.keyFile') || ''

  const msVal = (key: string) => readSecVal(cfg, 'metricsServer', key)
  form.metricsAddr = msVal('addr') || ''
  form.metricsPort = msVal('port') != null ? String(msVal('port')) : ''
  form.metricsUser = msVal('user') || ''
  form.metricsPassword = msVal('password') || ''
  form.metricsPprofEnable = msVal('pprofEnable') === true
  form.metricsTlsCertFile = msVal('tls.certFile') || ''
  form.metricsTlsKeyFile = msVal('tls.keyFile') || ''

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

  // 保留 current 中所有节的原始数据（含表单未接管的节与子表）
  for (const secKey of Object.keys(current.sections)) {
    // 表单接管的节由下方逻辑处理，这里只拷贝表单未生成且非表单接管的节
    const isOwned = FORM_OWNED_SECTION_KEYS[secKey] !== undefined ||
      Object.keys(FORM_OWNED_SECTION_KEYS).some((o) => FORM_OWNED_SUBSECTIONS[o]?.test(secKey))
    if (!isOwned && !cfg.sections[secKey]) cfg.sections[secKey] = { ...current.sections[secKey] }
  }

  // 表单接管的节：先移除表单拥有的键（清空字段=从配置删除），再合入表单值
  for (const [secName, ownedKeys] of Object.entries(FORM_OWNED_SECTION_KEYS)) {
    const curKey = findSectionKey(current.sections, secName)
    const formSec = cfg.sections[secName]
    if (formSec) {
      const merged: Record<string, any> = curKey ? { ...current.sections[curKey] } : {}
      if (ownedKeys === null) {
        for (const k of Object.keys(merged)) delete merged[k]
      } else if (curKey) {
        for (const k of ownedKeys) delete merged[k]
      }
      Object.assign(merged, formSec)
      cfg.sections[secName] = merged
    } else if (curKey && ownedKeys === null) {
      // 整节接管且表单已清空 → 整节移除
      delete cfg.sections[curKey]
    } else if (curKey && ownedKeys !== null) {
      // 键级接管但表单未生成该节（如 transport 全空）：仅保留非表单键
      const merged: Record<string, any> = { ...current.sections[curKey] }
      for (const k of ownedKeys) delete merged[k]
      if (Object.keys(merged).length > 0) {
        cfg.sections[curKey] = merged
      } else {
        delete cfg.sections[curKey]
      }
    }
    // 表单生成父节时，删除与表单字段冲突的子表（避免 TOML 重复表定义）
    const subPattern = FORM_OWNED_SUBSECTIONS[secName]
    if (subPattern && formSec) {
      for (const secKey of Object.keys(cfg.sections)) {
        if (subPattern.test(secKey)) delete cfg.sections[secKey]
      }
    }
  }

  // roots：保留表单未接管的键，表单拥有的键以表单为准（含删除）
  const roots: Record<string, any> = { ...current.roots }
  for (const k of FORM_OWNED_ROOT_KEYS) delete roots[k]
  cfg.roots = { ...roots, ...cfg.roots }

  // 节顺序：表单规范节在前，其余保留原有顺序
  const existingOrder = CANONICAL_SECTIONS.filter((s) => !!cfg.sections[s])
  const currentExtra = current.order
    .filter((o) => o.startsWith('__section:'))
    .map((o) => o.slice(10))
    .filter((n) => !CANONICAL_SECTIONS.some((c) => c.toLowerCase() === n.toLowerCase()))
  cfg.order = [
    ...existingOrder.map((s) => `__section:${s}`),
    ...currentExtra.map((s) => `__section:${s}`),
  ]
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
    resetGroupState()

    if (form.serverPort || form.tlsEnable || form.webUser || form.webPort || connMode.value === 'quic') showOptional.value = true
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

.opt-group-header-click {
  cursor: pointer;
  user-select: none;

  &:hover .opt-group-title {
    color: var(--el-color-primary);
  }
}

.opt-group-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
  flex-shrink: 0;
}

.opt-group-chevron {
  margin-left: auto;
  font-size: 13px;
  color: $color-text-secondary;
  transition: transform 0.2s;
}

.opt-group-open .opt-group-chevron {
  transform: rotate(180deg);
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

import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import router from './router'
import { setAuthHeader, setFrpcTarget } from './api/http'

import { useConnectionStore } from './stores/connection'

import './assets/css/var.css'
import './assets/css/dark.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

const connStore = useConnectionStore()
watch(
  () => connStore.authHeader,
  (header) => setAuthHeader(header),
  { immediate: true },
)
watch(
  () => connStore.baseUrl,
  (url) => setFrpcTarget(url),
  { immediate: true },
)

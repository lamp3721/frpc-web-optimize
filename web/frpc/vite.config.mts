import { fileURLToPath, URL } from 'node:url'
import http from 'node:http'
import https from 'node:https'
import type { IncomingMessage, ServerResponse } from 'node:http'

import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import ElementPlus from 'unplugin-element-plus/vite'

function dynamicApiProxy(): Plugin {
  let target = ''
  const setTarget = (t: string) => {
    target = t.replace(/\/+$/, '')
  }

  return {
    name: 'dynamic-api-proxy',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next) => {
        // Target management
        if (req.url?.startsWith('/__proxy_target')) {
          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk: Buffer) => { body += chunk.toString() })
            req.on('end', () => {
              try {
                const d = JSON.parse(body)
                if (d.target) setTarget(d.target)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ ok: true, target }))
              } catch {
                res.writeHead(400)
                res.end('bad request')
              }
            })
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ target }))
          }
          return
        }

        if (!target || !req.url?.startsWith('/api')) {
          next()
          return
        }

        try {
          const u = new URL(target)
          const isHttps = u.protocol === 'https:'
          const opts: http.RequestOptions = {
            hostname: u.hostname,
            port: u.port || (isHttps ? 443 : 80),
            path: req.url,
            method: req.method,
            headers: { ...req.headers },
          }
          delete opts.headers!['host']
          delete opts.headers!['origin']
          delete opts.headers!['referer']

          const transport = isHttps ? https : http
          const proxyReq = transport.request(opts, (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
            proxyRes.pipe(res)
          })
          proxyReq.on('error', (err) => {
            if (!res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }))
            }
          })
          req.pipe(proxyReq)
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid proxy target' }))
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [
    vue(),
    svgLoader(),
    ElementPlus({}),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    dynamicApiProxy(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
    dedupe: ['vue', 'element-plus', '@element-plus/icons-vue'],
    modules: [
      fileURLToPath(new URL('../node_modules', import.meta.url)),
      'node_modules',
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        additionalData: `@use "@shared/css/_index.scss" as *;`,
      },
    },
  },
  build: {
    assetsDir: '',
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})

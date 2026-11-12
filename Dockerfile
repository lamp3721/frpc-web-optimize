# syntax=docker/dockerfile:1

# ============================================================
# frpc Web 配置界面 · 纯前端镜像
# 只跑优化过的配置界面（静态文件 + nginx），
# 通过 FRPC_UPSTREAM 连接你已有的 frpc 实例的 webServer API，
# 替换官方/旧版面板。
# ============================================================
# 用法：
#   docker run -d -p 8080:80 -e FRPC_UPSTREAM=http://<frpc机器>:7500 \
#     ghcr.io/lamp3721/frpc-web-optimize:latest
#   浏览器打开 http://<本机>:8080，连接设置里填 frpc 面板的账号密码
#
# 需要 frpc 自带完整功能的（Store 代理管理/场景模板），
# 用 dockerfiles/Dockerfile-frpc-full 的全家桶镜像。

# ============ 前端构建 ============
FROM node:22-alpine AS web-builder

WORKDIR /web
# 先只拷贝 package 清单，让 npm ci 可以命中构建缓存
COPY web/package.json web/package-lock.json ./
COPY web/shared/package.json ./shared/package.json
COPY web/frpc/package.json ./frpc/package.json
COPY web/frps/package.json ./frps/package.json
RUN npm ci

# 再拷贝源码并构建
COPY web/shared/ ./shared/
COPY web/frpc/ ./frpc/
RUN npm run build --workspace frpc

# ============ 运行时：nginx 托管 + API 反代 ============
FROM nginx:alpine

# 静态文件
COPY --from=web-builder /web/frpc/dist/ /usr/share/nginx/html/

# nginx 配置模板（nginx 官方 entrypoint 会 envsubst FRPC_UPSTREAM 并生效）
COPY nginx-frontend.template /etc/nginx/templates/default.conf.template

# 反代目标：你已有的 frpc webServer 地址（容器内外均可，支持容器网络名）
ENV FRPC_UPSTREAM=http://frpc:7500

EXPOSE 80

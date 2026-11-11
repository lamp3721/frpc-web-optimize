# syntax=docker/dockerfile:1

# ============ 前端构建：frpc Web 配置界面 ============
FROM node:22-alpine AS web-builder

WORKDIR /web
# 先只拷贝 package 清单，让 npm ci 可以命中构建缓存
COPY web/package.json web/package-lock.json ./
COPY web/shared/package.json ./shared/package.json
COPY web/frpc/package.json ./frpc/package.json
COPY web/frps/package.json ./frps/package.json
RUN npm ci

# 再拷贝源码并构建（产物输出到 /web/frpc/dist）
COPY web/shared/ ./shared/
COPY web/frpc/ ./frpc/
RUN npm run build --workspace frpc

# ============ Go 构建：frpc（前端资源一并嵌入二进制） ============
FROM golang:1.26-alpine AS building

# Go 模块代理（国内环境友好，全球可达；构建时可覆盖：--build-arg GOPROXY=）
ARG GOPROXY="https://goproxy.cn,direct"

COPY . /building
COPY --from=web-builder /web/frpc/dist /building/web/frpc/dist
WORKDIR /building

RUN env CGO_ENABLED=0 GOFLAGS=-buildvcs=false \
    go build -trimpath -ldflags "-s -w" -tags frpc -o bin/frpc ./cmd/frpc

# ============ 运行时 ============
FROM alpine:3

RUN apk add --no-cache tzdata ca-certificates

# 非交互式工具用于容器内测试（nc/wget 为 busybox 自带）
COPY --from=building /building/bin/frpc /usr/bin/frpc
COPY docker-entrypoint.sh /usr/bin/docker-entrypoint.sh
RUN chmod +x /usr/bin/docker-entrypoint.sh

# 配置与 Store 数据目录（挂载卷持久化）
ENV FRPC_CONFIG=/etc/frp/frpc.toml \
    FRPC_SERVER_ADDR=127.0.0.1 \
    FRPC_SERVER_PORT=7000 \
    FRPC_WEB_PORT=7500 \
    FRPC_WEB_USER=admin \
    FRPC_WEB_PASSWORD=admin

VOLUME ["/etc/frp"]

# frpc Web 管理面板
EXPOSE 7500

# 供代理使用的端口段按需自行映射（-p <remotePort>:<remotePort>）
ENTRYPOINT ["/usr/bin/docker-entrypoint.sh"]

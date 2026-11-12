#!/bin/sh
# frpc 容器入口：配置文件不存在时按环境变量生成初始配置，
# 之后一切（frps 地址、令牌、代理/访客）都可在 Web 界面里改，改完点"更新并重载"。
set -e

CONFIG="${FRPC_CONFIG:-/etc/frp/frpc.toml}"
CONFIG_DIR=$(dirname "$CONFIG")
mkdir -p "$CONFIG_DIR"

if [ ! -f "$CONFIG" ]; then
  echo "[entrypoint] 未发现配置文件，生成初始配置：$CONFIG"
  cat > "$CONFIG" <<EOF
# 由 docker-entrypoint.sh 生成，之后可在 Web 界面（端口 ${FRPC_WEB_PORT:-7500}）直接修改
serverAddr = "${FRPC_SERVER_ADDR:-127.0.0.1}"
serverPort = ${FRPC_SERVER_PORT:-7000}
# 连不上 frps 时保持重试，容器常驻必备
loginFailExit = false

[webServer]
addr = "0.0.0.0"
port = ${FRPC_WEB_PORT:-7500}
user = "${FRPC_WEB_USER:-admin}"
password = "${FRPC_WEB_PASSWORD:-admin}"

# Store：Web 界面里创建的代理/访客保存在这里（/etc/frp 挂载卷即可持久化）
[store]
path = "/etc/frp/frpc-store.json"
EOF

  # 可选：认证令牌
  if [ -n "$FRPC_TOKEN" ]; then
    printf '\n[auth]\nmethod = "token"\ntoken = "%s"\n' "$FRPC_TOKEN" >> "$CONFIG"
    echo "[entrypoint] 已写入 auth.token"
  fi

  echo "[entrypoint] 初始配置完成。Web 界面: http://<容器IP>:${FRPC_WEB_PORT:-7500}  用户名: ${FRPC_WEB_USER:-admin}"
fi

# 注意：不要预创建 frpc-store.json —— store 文件由 frpc 首次写入时自动创建，
# 预创建的空文件反而会导致 JSON 解析失败。

exec /usr/bin/frpc -c "$CONFIG" "$@"

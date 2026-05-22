#!/bin/sh
# Runtime environment injection for Beast Vault frontend (Docker/nginx)
set -e

VITE_API_URL="${VITE_API_URL:-}"
API_BACKEND="${API_BACKEND:-beastvault-api:8080}"

# Inyectar config.js con la URL del API (vacío = same-origin via nginx proxy)
printf 'window.ENV = { VITE_API_URL: "%s" };\n' "$VITE_API_URL" > /usr/share/nginx/html/config.js

# Actualizar el proxy_pass de nginx al backend real
sed -i "s|set \$api_backend http://beastvault-api:8080;|set \$api_backend http://${API_BACKEND};|g" /etc/nginx/conf.d/default.conf

echo "[beastvault-entrypoint] VITE_API_URL: ${VITE_API_URL:-<empty — nginx proxy>}"
echo "[beastvault-entrypoint] API_BACKEND: ${API_BACKEND}"

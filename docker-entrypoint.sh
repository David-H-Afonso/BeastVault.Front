#!/bin/sh
# Runtime environment injection for Beast Vault frontend (Docker/nginx)
set -e

VITE_API_URL="${VITE_API_URL:-}"

# Inyectar config.js con la URL del API (vacío = same-origin via nginx proxy)
printf 'window.ENV = { VITE_API_URL: "%s" };\n' "$VITE_API_URL" > /usr/share/nginx/html/config.js

echo "[beastvault-entrypoint] VITE_API_URL: ${VITE_API_URL:-<empty — nginx proxy>}"

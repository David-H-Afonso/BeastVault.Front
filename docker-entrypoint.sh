#!/bin/sh
# Runtime environment injection for Beast Vault frontend (Docker/nginx)
set -e

VITE_API_URL="${VITE_API_URL:-}"

printf 'window.ENV = { VITE_API_URL: "%s" };\n' "$VITE_API_URL" > /usr/share/nginx/html/config.js

echo "[beastvault-entrypoint] VITE_API_URL: ${VITE_API_URL:-<empty — nginx proxy handles routing>}"

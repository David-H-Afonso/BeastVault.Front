#!/bin/sh
# Script para actualizar configuración en runtime
echo "Updating frontend configuration..."
echo "VITE_API_URL: ${VITE_API_URL:-<empty — set VITE_API_URL env var to the API address>}"

# Crear archivo de configuración que puede ser leído por el frontend
cat > /app/dist/config.js <<EOF
window.ENV = {
  VITE_API_URL: '${VITE_API_URL:-}'
};
EOF

echo "Configuration updated!"

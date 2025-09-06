#!/bin/sh
# Script para actualizar configuración en runtime
echo "Updating frontend configuration..."
echo "VITE_API_URL: ${VITE_API_URL:-http://localhost:8080}"

# Crear archivo de configuración que puede ser leído por el frontend
cat > /app/dist/config.js <<EOF
window.ENV = {
  VITE_API_URL: '${VITE_API_URL:-http://localhost:8080}'
};
EOF

echo "Configuration updated!"

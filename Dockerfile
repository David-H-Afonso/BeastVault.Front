# The Vite output is architecture-independent. Build it once on the native
# runner platform so multi-arch builds never execute Node under QEMU.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app

# Toolchain para deps nativas (solo en build)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
# Usa npm ci si hay lockfile; si no, npm install (evita fallo en CI)
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

COPY . .
# VITE_API_URL vacío en build → el frontend usa same-origin (nginx proxy)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Runtime remains target-platform specific (amd64/arm64).
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de nginx (incluye proxy al backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar entrypoint para inyección de variables de entorno en runtime
COPY docker-entrypoint.sh /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh

EXPOSE 80

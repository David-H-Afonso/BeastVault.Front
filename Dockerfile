# Build
FROM node:20-alpine AS build
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
# VITE_API_URL lo recibimos en build (valor por defecto si no se proporciona)
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Runtime (sirve los estáticos con un servidor sencillo)
FROM node:20-alpine
WORKDIR /app

# Instalar serve para servir los archivos estáticos
RUN npm install -g serve

# Copiar los archivos construidos
COPY --from=build /app/dist ./dist

# Copiar script de configuración
COPY update-config.sh /app/update-config.sh
RUN chmod +x /app/update-config.sh

# VITE_API_URL se configura en runtime via variable de entorno del contenedor.
# Si no se proporciona, update-config.sh dejará el valor vacío y el frontend
# intentará usar la misma URL base (útil si hay un proxy inverso).

EXPOSE 80

# Script de inicio que actualiza la configuración y luego sirve los archivos
CMD ["/bin/sh", "-c", "/app/update-config.sh && serve -s dist -l 80"]
 
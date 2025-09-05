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
# VITE_API_URL lo recibimos en build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Runtime (sirve los estáticos con un servidor sencillo)
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
 
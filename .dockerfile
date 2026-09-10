# =========================================================
# ETAPA 1: Compilación de Angular (Build)
# =========================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar proyecto Angular para producción
RUN npm run build

# =========================================================
# ETAPA 2: Servidor Nginx (Producción)
# =========================================================
FROM nginx:alpine

# Copiar artefactos compilados desde el builder
COPY --from=builder /app/dist/EduCoreOS-web/browser /usr/share/nginx/html

# Copiar configuración optimizada de Nginx (SPA routing, compresión, proxy API)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

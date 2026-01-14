# ============================================
# Dockerfile - Backend Node.js
# ============================================

FROM node:18-alpine

# Información del mantenedor
LABEL maintainer="tu-email@ejemplo.com"
LABEL description="Backend API - Sistema de Gestión de Torneos Deportivos"

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 5000

# Variable de entorno por defecto
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["npm", "start"]

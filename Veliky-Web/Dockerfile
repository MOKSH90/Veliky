# ==============================================================================
# VELIKY Web UI — Production Container
# Builds Vite + React SPA and serves via Nginx with reverse proxy to Veliky API & LLM
# ==============================================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# Compile TypeScript and bundle Vite
RUN npm run build

# ==============================================================================
# Production Nginx Runtime
# ==============================================================================
FROM nginx:alpine

# Remove default static site
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]

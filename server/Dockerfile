# Multi-stage build for Commerce Operations Foundation MCP Server

# 1) Install FULL dependencies (including dev) for building
FROM node:22-alpine3.20 AS deps-dev
WORKDIR /app
COPY package*.json ./
RUN apk update && apk upgrade && npm ci && npm cache clean --force

# 2) Build stage using dev dependencies (TypeScript, etc.)
FROM node:22-alpine AS builder
# Install build toolchain for any native deps during build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY --from=deps-dev /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# 3) Install production-only dependencies for runtime image
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 4) Runtime image with only production deps and built assets
FROM node:22-alpine AS production

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cof -u 1001

# Set working directory
WORKDIR /app

# Copy built application and production deps
COPY --from=builder --chown=cof:nodejs /app/dist ./dist
COPY --from=prod-deps --chown=cof:nodejs /app/node_modules ./node_modules
COPY --chown=cof:nodejs package*.json ./

# Create directories for runtime data
RUN mkdir -p /app/data /app/logs && \
    chown -R cof:nodejs /app

# Switch to non-root user
USER cof

# Health check - verify the build artifact exists and can be imported
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node --eval "import('fs').then(fs => { if (!fs.existsSync('dist/index.js')) { console.error('Build artifact missing'); process.exit(1); } return import('./dist/index.js'); }).then(() => { console.log('Health check passed'); process.exit(0); }).catch(err => { console.error('Health check failed:', err.message); process.exit(1); })" || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Default command (can be overridden)
CMD ["node", "dist/index.js"]

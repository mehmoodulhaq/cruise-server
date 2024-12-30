# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:prod

# Stage 2: Production
FROM node:18
ENV PORT 3000
ENV NODE_ENV production
WORKDIR /app

# Copy built assets and production dependencies
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Security: Run as non-root user
USER node

# Health check - Update path as needed
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start the application
EXPOSE ${PORT}
CMD ["npm", "start"]
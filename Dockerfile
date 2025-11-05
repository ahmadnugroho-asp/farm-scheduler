# Multi-stage build for Farm Task Scheduler
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy application files
COPY server/ ./server/
COPY client/ ./client/

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/tasks', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set working directory to server
WORKDIR /app/server

# Start the application
CMD ["node", "server.js"]

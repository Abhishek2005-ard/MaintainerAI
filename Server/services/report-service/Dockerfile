FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Final lightweight stage
FROM node:20-alpine

WORKDIR /app

# Copy dependencies and source files
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/

# Set environment
ENV NODE_ENV=production
ENV PORT=8004

# Expose port
EXPOSE 8004

# Start command
CMD ["npm", "start"]

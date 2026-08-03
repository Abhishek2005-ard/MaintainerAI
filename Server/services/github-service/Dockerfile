FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY services/github-service/package*.json ./services/github-service/

RUN npm ci --only=production && cd services/github-service && npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/github-service/node_modules ./services/github-service/node_modules
COPY services/github-service ./services/github-service
COPY services/shared ./services/shared

EXPOSE 8003

CMD ["node", "services/github-service/src/index.js"]

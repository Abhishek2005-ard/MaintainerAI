FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY services/ai-service/package*.json ./services/ai-service/

RUN npm install --legacy-peer-deps --only=production && cd services/ai-service && npm install --legacy-peer-deps --only=production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/ai-service/node_modules ./services/ai-service/node_modules
COPY services/ai-service ./services/ai-service
COPY services/shared ./services/shared

EXPOSE 8002

CMD ["node", "services/ai-service/src/index.js"]

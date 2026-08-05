FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY gateway/package*.json ./gateway/

RUN npm ci --only=production && cd gateway && npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/gateway/node_modules ./gateway/node_modules
COPY gateway ./gateway
COPY services/shared ./services/shared

USER node

EXPOSE 8000

CMD ["node", "gateway/index.js"]

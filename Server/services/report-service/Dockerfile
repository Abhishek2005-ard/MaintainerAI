FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY services/report-service/package*.json ./services/report-service/

RUN npm ci --only=production && cd services/report-service && npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/report-service/node_modules ./services/report-service/node_modules
COPY services/report-service ./services/report-service
COPY services/shared ./services/shared

EXPOSE 8004

CMD ["node", "services/report-service/src/index.js"]

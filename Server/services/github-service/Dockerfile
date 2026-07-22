# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm clean-install
COPY src ./src
RUN npm run build

# Run stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm clean-install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 8003
CMD ["node", "dist/index.js"]

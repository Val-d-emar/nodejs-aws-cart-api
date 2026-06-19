# ==========================================
# STAGE 1: Build stage (TypeScript)
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ==========================================
# STAGE 2: Production stage
# ==========================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --only=production --legacy-peer-deps

COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/src/main"]

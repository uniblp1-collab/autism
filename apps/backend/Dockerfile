FROM node:20-alpine AS base
# Без этого Prisma не может определить версию OpenSSL в голом alpine-образе и молча
# подставляет несуществующую openssl-1.1.x — движок падает при старте с
# "Error loading shared library libssl.so.1.1". node:20-alpine идёт с OpenSSL 3.x.
RUN apk add --no-cache openssl
RUN corepack enable
WORKDIR /app

# --- deps: только манифесты, чтобы кэш слоя переиспользовался, пока зависимости не меняются ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# --- build: prisma generate ДО nest build (Prisma Client должен существовать при компиляции) ---
FROM deps AS build
COPY . .
RUN pnpm --filter @autism-connect/database run generate
RUN pnpm --filter @autism-connect/backend run build

# --- runtime ---
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "apps/backend/dist/main.js"]

FROM node:20-alpine AS base
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

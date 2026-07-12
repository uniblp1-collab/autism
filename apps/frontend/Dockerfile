FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# --- deps: только манифесты, чтобы кэш слоя переиспользовался, пока зависимости не меняются ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# --- build ---
# Next.js встраивает NEXT_PUBLIC_* переменные в бандл на этапе `next build`, а не в рантайме —
# поэтому значение должно прийти через ARG/ENV именно в этот стейдж, а не только через
# `environment:` в docker-compose.yml (тот применяется лишь при старте контейнера).
FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_EDIT_MODE_ENABLED=true
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_EDIT_MODE_ENABLED=${NEXT_PUBLIC_EDIT_MODE_ENABLED}
COPY . .
RUN pnpm --filter @autism-connect/frontend run build

# --- runtime: только standalone-сервер + статика + public, не весь node_modules ---
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/apps/frontend/.next/standalone ./
COPY --from=build /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build /app/apps/frontend/public ./apps/frontend/public
EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]

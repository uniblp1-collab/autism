# syntax=docker/dockerfile:1
FROM node:20-alpine
RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @autism-connect/database run generate
RUN pnpm --filter @autism-connect/backend run build

EXPOSE 4000
CMD ["sh", "-c", "pnpm --filter @autism-connect/database run migrate:deploy && pnpm --filter @autism-connect/database run seed && node apps/backend/dist/main.js"]

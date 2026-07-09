# syntax=docker/dockerfile:1
FROM node:20-alpine
RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @autism-connect/frontend run build

EXPOSE 3000
CMD ["pnpm", "--filter", "@autism-connect/frontend", "run", "start"]

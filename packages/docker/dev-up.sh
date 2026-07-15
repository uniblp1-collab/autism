#!/usr/bin/env bash
set -euo pipefail

# Запуск из корня репозитория: ./packages/docker/dev-up.sh
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/packages/docker/docker-compose.yml"
ENV_FILE="$ROOT_DIR/.env"

echo "==> Проверяю, что OrbStack (Docker) запущен..."
if ! docker info > /dev/null 2>&1; then
  echo "OrbStack не запущен. Открой приложение OrbStack и повтори запуск."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "==> .env не найден, копирую .env.example"
  cp "$ROOT_DIR/packages/docker/.env.example" "$ENV_FILE"
fi

echo "==> Собираю и поднимаю контейнеры (postgres, backend, frontend)..."
docker compose -f "$COMPOSE_FILE" up --build -d

echo "==> Жду, пока backend поднимется..."
until curl -sf http://localhost:3001/health > /dev/null 2>&1; do
  sleep 2
done
sleep 1

echo "==> Прогоняю миграции Prisma..."
# Имя пакета в packages/database/package.json — "@autism-connect/database", а не "database".
docker compose -f "$COMPOSE_FILE" exec -T backend pnpm --filter @autism-connect/database exec prisma migrate deploy

echo "==> Проверяю, нужен ли сид (библиотека карточек)..."
docker compose -f "$COMPOSE_FILE" exec -T backend pnpm --filter @autism-connect/database exec prisma db seed || \
  echo "Сид уже применён или пропущен — это нормально при повторном запуске."

echo ""
echo "Готово. Приложение доступно:"
echo "  Frontend:      http://localhost:3000"
echo "  Backend API:   http://localhost:3001"
echo ""
echo "Логи:   docker compose -f $COMPOSE_FILE logs -f"
echo "Уборка: ./packages/docker/dev-clean.sh"

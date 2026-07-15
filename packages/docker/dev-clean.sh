#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/packages/docker/docker-compose.yml"

echo "Это остановит и удалит все контейнеры Autism Connect,"
echo "а также базу данных Postgres и загруженные картинки карточек (volumes)."
read -p "Продолжить? [y/N] " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Отменено."
  exit 0
fi

echo "==> Останавливаю и удаляю контейнеры + volumes..."
docker compose -f "$COMPOSE_FILE" down -v

read -p "Удалить также скачанные образы (node, postgres)? [y/N] " confirm_images
if [[ "$confirm_images" == "y" || "$confirm_images" == "Y" ]]; then
  echo "==> Удаляю образы проекта..."
  docker rmi -f \
    "$(docker images -q postgres:16)" \
    2>/dev/null || true
  docker compose -f "$COMPOSE_FILE" down --rmi local -v 2>/dev/null || true
fi

echo ""
echo "Готово. На системе не осталось контейнеров, volumes и (опционально) образов проекта."
echo "OrbStack можно оставить для следующего раза или удалить отдельно через Finder."

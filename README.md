# Autism Connect — MVP

AAC-платформа (альтернативная коммуникация) для детей с РАС. Родительский кабинет
для управления профилями детей, библиотекой карточек, расписаниями и статистикой;
отдельный упрощённый экран ребёнка для составления предложений из карточек и
озвучивания их вслух.

Архитектурные решения и схема БД зафиксированы в [`ARCHITECTURE.md`](./ARCHITECTURE.md)
и [`DATABASE.md`](./DATABASE.md) — они первичны по отношению к этому README.
Визуальный язык (цвета, радиусы, типографика, спецификации компонентов) — в
[`DESIGN.md`](./DESIGN.md), реализован буквально в `packages/ui`. Правила для
разработки — в [`CLAUDE.md`](./CLAUDE.md).

## Стек

| Слой | Технология |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, TailwindCSS, React Query, Zustand |
| Backend | NestJS (DDD: domain/application/infrastructure/presentation) |
| ORM / БД | Prisma / PostgreSQL |
| Файлы | MinIO (S3-совместимое) |
| Авторизация | JWT (access + refresh) |
| Тесты | Jest (backend use-cases), Jest + React Testing Library (frontend) |

## Структура репозитория

```
apps/frontend/   Next.js приложение (родительский кабинет + экран ребёнка)
apps/backend/    NestJS API (Auth, Children, Categories, Cards, Favorites,
                 History, Schedule, Statistics — каждый модуль в DDD-слоях)
packages/ui/     Переиспользуемые UI-примитивы (CardButton, тема, тач-таргеты)
packages/shared/ Общие типы/enum'ы/zod-схемы для фронта и бэка
packages/database/ Prisma schema, миграции, seed (18 категорий, 300+ карточек)
packages/docker/ docker-compose и Dockerfile'ы
```

## Быстрый старт (локально, без Docker)

Требуется Node.js 20+, pnpm, локальный PostgreSQL.

```bash
pnpm install

# База данных
cp packages/database/.env.example packages/database/.env 2>/dev/null || true
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/autism_connect?schema=public"' > packages/database/.env
pnpm --filter @autism-connect/database run generate
pnpm --filter @autism-connect/database run migrate   # создаёт схему
pnpm --filter @autism-connect/database run seed      # 18 категорий + 300+ карточек + демо-родитель/ребёнок

# Backend
cp apps/backend/.env.example apps/backend/.env
pnpm --filter @autism-connect/backend run build
pnpm --filter @autism-connect/backend run start       # http://localhost:4000/api

# Frontend (в отдельном терминале)
cp apps/frontend/.env.example apps/frontend/.env.local
pnpm --filter @autism-connect/frontend run dev         # http://localhost:3000
```

Демо-аккаунт после seed: `demo@autismconnect.dev` / `Password123!` (один ребёнок,
утреннее расписание из 4 шагов).

## Через Docker Compose (OrbStack/Docker Desktop)

```bash
./packages/docker/dev-up.sh
```

Одной командой: копирует `packages/docker/.env.example` в корневой `.env` (если его ещё
нет), собирает и поднимает `postgres`, `minio`, `backend`, `frontend`, дожидается
`GET /health` backend'а и прогоняет `prisma migrate deploy` + сид (идемпотентно —
безопасно перезапускать). После этого:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MinIO-консоль: http://localhost:9001 (`minioadmin` / `minioadmin`)

Уборка (останавливает и опционально удаляет контейнеры/volumes/образы):
```bash
./packages/docker/dev-clean.sh
```

Для e2e-тестов backend — отдельная БД:
```bash
docker compose -f packages/docker/docker-compose.test.yml up -d
```

## Тесты

```bash
pnpm --filter @autism-connect/backend run test    # unit-тесты use-case'ов
pnpm --filter @autism-connect/frontend run test    # RTL-тест sentence-builder
```

Обязательное unit-покрытие (см. CLAUDE.md §4.6) реализовано для критичных
use-case'ов модулей `cards`, `history`, `schedule`, `statistics` — репозитории
мокаются через доменные интерфейсы, без поднятия реальной БД.

## Точки расширения под AI (Phase 2/3)

`CardGeneratorPort` (`apps/backend/src/modules/cards/domain/card-generator.port.ts`)
зарезервирован под будущую AI-генерацию карточек; в MVP реализован `NoopCardGeneratorAdapter`.
Аналогичные порты закладываются для социальных историй и рекомендаций на Phase 2/3
(см. ARCHITECTURE.md §5) — в MVP не реализуются.

## Известные ограничения MVP

- Изображения карточек — placeholder-пути (`/cards/<category>/<slug>.svg`); реальные
  файлы загружаются через админку/MinIO после первого запуска, не хранятся в репозитории.
  Разрешение через `next/image`, но при показе они выглядят как «битые» до загрузки
  реальных ассетов.
- Оба `Dockerfile` не собирались end-to-end в текущей песочнице — исходящие pull'ы
  базовых образов с Docker Hub блокируются сетевой политикой окружения. Вместо этого
  каждый шаг проверен эквивалентно вне контейнера: `docker compose config` валиден,
  `pnpm install --frozen-lockfile` с тем же набором манифестов, что копирует каждый
  Dockerfile, проходит успешно, standalone-сборка фронтенда запущена как отдельный
  процесс с точной структурой файлов, которую производит финальный стейдж, а бэкенд
  проверен собранным (`nest build` + `node dist/main.js`) с привязкой к `0.0.0.0`,
  рабочим `/health` (без auth, без префикса `/api`) и CORS, отражающим `FRONTEND_URL`.

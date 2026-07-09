# ARCHITECTURE.md — Autism Connect MVP

## 1. Общие принципы

Проект строится как **low-code платформа**, а не статическое приложение с "зашитым" контентом. Это ключевое архитектурное ограничение, влияющее на все слои:

- Весь пользовательский контент (карточки, категории, расписания) хранится в БД, никогда — в коде.
- Backend строится по принципам **Domain-Driven Design (DDD)** с чётким разделением на слои.
- Frontend строится по **feature-based** структуре с разделением UI / бизнес-логики / данных.
- Архитектура должна допускать подключение AI-модулей (генерация карточек, соц. историй, рекомендаций) без переписывания ядра — через порты/адаптеры (Ports & Adapters / Hexagonal подход внутри отдельных модулей).

---

## 2. Монорепозиторий

```
apps/
  frontend/          # Next.js приложение
  backend/            # NestJS приложение
packages/
  ui/                 # переиспользуемые UI-компоненты (React + Tailwind)
  shared/             # общие типы, DTO, enum'ы, константы, zod-схемы
  database/           # Prisma schema, миграции, seed-скрипты
  docker/             # docker-compose, Dockerfile'ы, конфигурации инфраструктуры
```

Управление монорепо: **pnpm workspaces** (либо turborepo, если требуется кэширование сборок). `packages/shared` — единственный источник истины для типов, которые используются и на фронте, и на бэке (например, `Card`, `Category`, `ScheduleItem`).

---

## 3. Backend — слоистая архитектура (NestJS + DDD)

Каждый bounded context — это отдельный NestJS-модуль. Контексты MVP:

- `AuthModule`
- `ChildrenModule`
- `CardsModule`
- `CategoriesModule`
- `FavoritesModule`
- `HistoryModule`
- `ScheduleModule`
- `StatisticsModule`

### 3.1 Слои внутри модуля

```
modules/
  cards/
    domain/
      card.entity.ts          # доменная сущность, чистая бизнес-логика, без зависимостей от Nest/Prisma
      card.repository.ts      # интерфейс (порт) репозитория
    application/
      dto/
        create-card.dto.ts
        update-card.dto.ts
      use-cases/
        create-card.use-case.ts
        search-cards.use-case.ts
        mark-favorite.use-case.ts
      cards.service.ts        # оркестрация use-case'ов
    infrastructure/
      prisma-card.repository.ts  # реализация порта через Prisma (адаптер)
      cards.mapper.ts             # маппинг Prisma-модель <-> доменная сущность
    presentation/
      cards.controller.ts
      cards.module.ts
```

**Правило зависимостей:** `presentation → application → domain`, `infrastructure → domain` (реализует интерфейсы домена). Домен ничего не знает про Prisma, HTTP или NestJS-декораторы.

### 3.2 Почему именно так

- Это даёт точку расширения для AI: например, `GenerateCardUseCase` в будущем сможет заменить свою реализацию (ручное создание → AI-генерация) не трогая контроллеры и репозитории.
- Тестируемость: доменная логика и use-case'ы тестируются без поднятия БД (мокается интерфейс репозитория).

### 3.3 Сквозные (cross-cutting) механизмы

- **Валидация:** `class-validator` + DTO на входе каждого контроллера.
- **Ошибки:** единый `GlobalExceptionFilter`, унифицированный формат ответа об ошибке (`{ statusCode, message, code }`).
- **Логирование:** централизованный логгер (`nestjs-pino` или встроенный `Logger` с форматированием в JSON), request-id прокидывается через весь запрос.
- **Авторизация:** JWT (access + refresh токены), `AuthGuard` на уровне контроллеров, `@CurrentUser()` decorator.
- **Конфигурация:** `@nestjs/config`, все параметры — через `.env`, никаких хардкод-констант окружения.

---

## 4. Frontend — Next.js

### 4.1 Структура

```
apps/frontend/
  app/
    (auth)/
      login/
      register/
    (dashboard)/           # родительский кабинет
      children/
      cards/
      schedule/
      statistics/
    (child)/                # экран ребёнка — максимально простой UI
      [childId]/
  features/
    auth/
    children/
    cards/
    schedule/
    statistics/
    sentence-builder/
    tts/
  entities/                 # доменные модели фронта (Card, Child, Category)
  shared/
    ui/                     # обёртки над packages/ui
    lib/                    # хелперы, форматтеры
    api/                    # клиенты React Query + fetch/axios обёртки
  store/                    # Zustand-сторы (например, sentenceStore, uiStore)
```

### 4.2 Управление состоянием

- **React Query** — весь серверный стейт (карточки, категории, история, статистика). Никакого дублирования серверных данных в Zustand.
- **Zustand** — только клиентский эфемерный стейт: собираемое предложение, текущий выбранный ребёнок, состояние UI (открытые модалки).

### 4.3 Экран ребёнка (child mode)

Отдельный route-группа `(child)` с урезанным layout: без меню, без ссылок на настройки, ничего кликабельного кроме карточек/категорий/кнопки озвучивания/расписания. Это отдельная зона, а не просто скрытые элементы в общем UI — так безопаснее и проще поддерживать требование "ребёнок не видит лишнего".

### 4.4 UX-ограничения на уровне архитектуры компонентов

Реализуются как переиспользуемые примитивы в `packages/ui`, чтобы разработчик физически не мог случайно нарушить требования ТЗ:

- `<CardButton>` — минимальный размер тач-таргета (например, ≥88px), без анимаций мигания.
- `<HighContrastThemeProvider>` — токены цвета с гарантированным контрастом.
- Запрещённые паттерны (мелкие кнопки, agressive blinking animation) закладываются как ESLint/дизайн-токен ограничения, а не проверяются вручную.

---

## 5. Точки расширения под AI (Phase 2/3)

Архитектура закладывает интерфейсы уже в MVP, без реализации:

```ts
// domain-level port, backend/modules/cards/domain/card-generator.port.ts
interface CardGeneratorPort {
  generateCard(prompt: CardGenerationRequest): Promise<CardDraft>;
}
```

В MVP этот порт не реализуется (или реализуется NoOp/заглушкой), но use-case `CreateCardUseCase` уже спроектирован так, чтобы принимать источник карточки (`manual | ai-generated`) без изменения схемы БД (см. `DATABASE.md`, поле-задел `source`).

Аналогично закладываются порты для:
- `SocialStoryGeneratorPort` (генерация социальных историй),
- `RecommendationEnginePort` (персональные рекомендации),
- `AnalyticsInsightPort` (углублённая аналитика поверх `StatisticsModule`).

---

## 6. Инфраструктура

- **Docker Compose**: сервисы `frontend`, `backend`, `postgres`, `minio` (или интеграция с внешним S3), `nginx` (опционально, для reverse proxy в проде).
- **Миграции:** через Prisma Migrate, запускаются автоматически в CI/CD перед деплоем backend.
- **Тестовые окружения:** отдельная БД для e2e-тестов backend, поднимается через `docker-compose.test.yml`.

---

## 7. Нефункциональные требования → архитектурные решения

| Требование ТЗ | Архитектурное решение |
|---|---|
| Загрузка первой страницы ≤ 2 сек | Next.js SSR/ISR для статичных экранов, code-splitting по route-группам |
| Lighthouse ≥ 90 | Ленивая загрузка изображений карточек, `next/image`, минимизация клиентского JS в `(child)` зоне |
| REST → GraphQL в будущем | Слой `application`/use-case полностью не зависит от протокола presentation-слоя |
| Адаптивность от 768px | Tailwind breakpoints, mobile-first проектирование компонентов `packages/ui` |
| Покрытие unit-тестами критичных сервисов | Обязательные тесты для `use-cases` в `CardsModule`, `ScheduleModule`, `HistoryModule` |
| Централизованное логирование | Единый логгер-модуль, инъектируемый во все сервисы backend |

---

## 8. Итог

Ядро системы — это набор независимых от UI и AI бизнес-модулей с чёткими портами. Frontend и будущие AI-компоненты — это заменяемые адаптеры вокруг этого ядра. Такой подход напрямую реализует принцип из ТЗ (раздел 17): "любая новая карточка, категория, упражнение, игра или сценарий должны добавляться через административный интерфейс без изменения исходного кода".

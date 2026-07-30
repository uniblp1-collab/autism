import type { Card, Category, Child, Favorite, Schedule } from "@autism-connect/shared";
// Демо-срез реальной БД, вшитый в сборку (выгружается packages/database/scripts/export-demo-data.mjs).
// В офлайн-демо это ЕДИНСТВЕННЫЙ источник данных вместо backend (TASK_DEMO_OFFLINE.md §3).
import bundle from "../../public/demo-data/cards.json";
import {
  addFavoriteCardId,
  applyStoredOrder,
  getCardsPerRow,
  getFavoriteCardIds,
  getScheduleCompletion,
  removeFavoriteCardId,
  setCardsPerRow,
  setScheduleCompletion,
  type DemoScheduleStructure,
} from "./demoLocalStorage";

/**
 * Флаг офлайн-демо. Единственная точка, где приложение узнаёт, что backend недоступен —
 * дальше вся продуктовая логика (сетка, прокрутка, озвучивание, избранное, расписание)
 * работает как обычно, не зная, откуда пришли данные (TASK_DEMO_OFFLINE.md §1/§3).
 * NEXT_PUBLIC_ — значение инлайнится на этапе сборки, поэтому не-демо-сборка вырезает демо-ветку.
 */
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_CHILD_ID: string = bundle.demoChildId;

// Префикс пути размещения (см. next.config.js). Картинки карточек в JSON хранятся как
// /demo-data/images/... (от корня); при размещении в подпапке (GitHub Pages: /autism) браузер
// должен грузить их с этим префиксом. next/image/Link учитывают basePath сами, а обычный <img>
// в CardButton — нет, поэтому дописываем префикс к imageUrl здесь, в единой точке данных.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
function withBasePath(url: string | null): string | null {
  return url && url.startsWith("/") ? `${BASE_PATH}${url}` : url;
}

const demoChild = bundle.child as unknown as Child;
const demoCategories = bundle.categories as unknown as Category[];
const demoCards = (bundle.cards as unknown as Card[]).map((card) => ({
  ...card,
  imageUrl: withBasePath(card.imageUrl),
}));

/** Все URL картинок карточек демо — используется для предзагрузки при старте (TASK_DEMO_ENHANCEMENTS.md §1),
 * чтобы переход между разделами не ждал сеть/декодирование даже до того, как service worker
 * успел закэшировать всё при установке. */
export const demoCardImageUrls: string[] = Array.from(
  new Set(demoCards.map((c) => c.imageUrl).filter((u): u is string => Boolean(u))),
);

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// Структура расписания (шаги дня, БЕЗ ежедневных отметок) — статична, приходит из демо-JSON
// конкретной сборки. Нужна отдельно для экспорта профиля (раздел 4.1) и для наложения
// сохранённых в localStorage ежедневных отметок (раздел 5) при каждом GET.
const demoScheduleStructure: DemoScheduleStructure[] = (bundle.schedules as unknown as Schedule[]).map((s) => ({
  id: s.id,
  title: s.title,
  items: s.items.map((i) => ({ id: i.id, title: i.title, order: i.order })),
}));
export function getDemoScheduleStructure(): DemoScheduleStructure[] {
  return deepClone(demoScheduleStructure);
}

const demoSchedulesStatic: Schedule[] = deepClone(bundle.schedules as unknown as Schedule[]);

function parseBool(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  return value === "true";
}

/**
 * Повторяет серверную фильтрацию/сортировку карточек (PrismaCardRepository.search) поверх
 * статичного JSON — чтобы demo-режим отдавал ровно то же, что отдал бы backend на `GET /cards`.
 * Держать в синхроне с apps/backend/.../infrastructure/prisma-card.repository.ts. Дополнительно
 * (чего на сервере нет) — если задан categoryId, поверх серверной сортировки накладывается
 * локально сохранённый порядок карточек этого раздела (drag-reorder, TASK_DEMO_ENHANCEMENTS.md §3).
 */
function searchCards(params: URLSearchParams): Card[] {
  const categoryId = params.get("categoryId") ?? undefined;
  const childId = params.get("childId") ?? undefined;
  const query = params.get("query") ?? undefined;
  const includeCustom = parseBool(params.get("includeCustom")) ?? false;
  const cardType = params.get("cardType") ?? undefined;
  const isSystemCard = parseBool(params.get("isSystemCard")) ?? false;

  const result = demoCards.filter((card) => {
    if ((card.isSystemCard ?? false) !== isSystemCard) return false;
    if (categoryId && card.categoryId !== categoryId) return false;
    if (cardType && card.cardType !== cardType) return false;
    if (query && !card.title.toLowerCase().includes(query.toLowerCase())) return false;

    // Демо-срез содержит только библиотечные карточки (childId === null), но повторяем
    // серверную логику childId/includeCustom дословно, чтобы поведение совпадало 1:1.
    if (childId && includeCustom) return card.childId === null || card.childId === childId;
    if (childId) return card.childId === childId;
    return card.childId === null;
  });

  const sorted = result.sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title));
  return categoryId ? applyStoredOrder(categoryId, sorted) : sorted;
}

function splitPath(path: string): { segments: string[]; params: URLSearchParams } {
  const [rawPath, rawQuery = ""] = path.split("?");
  const segments = rawPath.split("/").filter(Boolean);
  return { segments, params: new URLSearchParams(rawQuery) };
}

/**
 * Мини-«backend» демо-режима: разбирает путь/метод ровно тех ручек, что использует экран
 * ребёнка, и отвечает из статичного JSON + localStorage. Всё, что связано с записью
 * СОДЕРЖИМОГО на сервер (история, статистика, правки карточек/разделов), — по-прежнему no-op:
 * демо разрешает менять порядок и настройки, но не содержимое (TASK_DEMO_ENHANCEMENTS.md, вводная
 * часть — это осознанное расширение рамок TASK_DEMO_OFFLINE.md, а не отмена).
 */
export async function handleDemoRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const { segments, params } = splitPath(path);
  const [resource, second, third] = segments;

  // --- Категории -----------------------------------------------------------
  if (resource === "categories" && method === "GET") {
    return demoCategories as unknown as T;
  }

  // --- Карточки ------------------------------------------------------------
  if (resource === "cards" && method === "GET") {
    if (second) {
      const card = demoCards.find((c) => c.id === second);
      return (card ?? null) as unknown as T;
    }
    return searchCards(params) as unknown as T;
  }

  // --- Ребёнок ---------------------------------------------------------------
  // cardsPerPage подменяется на локально сохранённое "карточек в ряду" (раздел 2/4) — контент
  // ребёнка (имя, возраст и т.п.) в демо не редактируется, поэтому остальные поля — из JSON как есть.
  if (resource === "children" && method === "GET") {
    const child = { ...demoChild, cardsPerPage: getCardsPerRow() };
    if (second) return child as unknown as T;
    return [child] as unknown as T;
  }
  if (resource === "children" && method === "PATCH") {
    const body = JSON.parse((options.body as string) ?? "{}");
    if (typeof body.cardsPerPage === "number") setCardsPerRow(body.cardsPerPage);
    return { ...demoChild, cardsPerPage: getCardsPerRow() } as unknown as T;
  }

  // --- Избранное (localStorage — переживает перезапуск, раздел 3/4) --------
  if (resource === "favorites" && method === "GET") {
    const favoriteIds = getFavoriteCardIds();
    const favorites: Favorite[] = favoriteIds.map((cardId, index) => ({
      id: `demo-fav-${cardId}`,
      childId: params.get("childId") ?? DEMO_CHILD_ID,
      cardId,
      order: index,
      createdAt: new Date(0).toISOString(),
    }));
    return favorites as unknown as T;
  }
  if (resource === "favorites" && method === "POST") {
    const { cardId } = JSON.parse((options.body as string) ?? "{}");
    addFavoriteCardId(cardId);
    const favorite: Favorite = {
      id: `demo-fav-${cardId}`,
      childId: DEMO_CHILD_ID,
      cardId,
      order: getFavoriteCardIds().indexOf(cardId),
      createdAt: new Date().toISOString(),
    };
    return favorite as unknown as T;
  }
  if (resource === "favorites" && method === "DELETE") {
    // /favorites/:childId/:cardId
    removeFavoriteCardId(third);
    return undefined as T;
  }

  // --- Расписание (структура из JSON + отметки из localStorage, раздел 5) --
  if (resource === "schedules" && method === "GET") {
    const childId = params.get("childId");
    const schedules = demoSchedulesStatic
      .filter((s) => s.childId === childId)
      .map((schedule) => ({
        ...schedule,
        items: schedule.items.map((item) => {
          const isCompleted = getScheduleCompletion(item.id);
          return { ...item, isCompleted, completedAt: isCompleted ? item.completedAt ?? new Date().toISOString() : null };
        }),
      }));
    return schedules as unknown as T;
  }
  if (resource === "schedules" && second === "items" && method === "PATCH") {
    // /schedules/items/:itemId
    const itemId = third;
    const { isCompleted } = JSON.parse((options.body as string) ?? "{}");
    setScheduleCompletion(itemId, Boolean(isCompleted));
    for (const schedule of demoSchedulesStatic) {
      const item = schedule.items.find((i) => i.id === itemId);
      if (item) {
        return { ...item, isCompleted: Boolean(isCompleted), completedAt: isCompleted ? new Date().toISOString() : null } as unknown as T;
      }
    }
    return undefined as T;
  }

  // --- Запись на сервер отключена в демо (история/статистика) --------------
  if (resource === "history" || resource === "statistics") {
    return {} as T;
  }

  // Любая другая ручка (авторизация, админка, правки карточек/разделов) в демо не должна
  // вызываться — экраны/действия, которые их дёргают, в демо не показываются (раздел 8).
  throw new Error(`Демо-режим: запрос ${method} ${path} не поддерживается (backend отключён).`);
}

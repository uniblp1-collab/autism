import type { Card, Category, Child, Favorite, Schedule } from "@autism-connect/shared";
// Демо-срез реальной БД, вшитый в сборку (выгружается packages/database/scripts/export-demo-data.mjs).
// В офлайн-демо это ЕДИНСТВЕННЫЙ источник данных вместо backend (TASK_DEMO_OFFLINE.md §3).
import bundle from "../../public/demo-data/cards.json";

/**
 * Флаг офлайн-демо. Единственная точка, где приложение узнаёт, что backend недоступен —
 * дальше вся продуктовая логика (сетка, пагинация, озвучивание, избранное, расписание)
 * работает как обычно, не зная, откуда пришли данные (TASK_DEMO_OFFLINE.md §1/§3).
 * NEXT_PUBLIC_ — значение инлайнится на этапе сборки, поэтому не-демо-сборка вырезает демо-ветку.
 */
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_CHILD_ID: string = bundle.demoChildId;

const demoChild = bundle.child as unknown as Child;
const demoCategories = bundle.categories as unknown as Category[];
const demoCards = bundle.cards as unknown as Card[];

// Избранное и расписание в демо — мутабельны в памяти сессии (в рамках открытой вкладки),
// не сохраняются между перезапусками. Для показа этого достаточно (TASK_DEMO_OFFLINE.md §4).
let demoFavorites: Favorite[] = deepClone(bundle.favorites as unknown as Favorite[]);
const demoSchedules: Schedule[] = deepClone(bundle.schedules as unknown as Schedule[]);

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseBool(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  return value === "true";
}

/**
 * Повторяет серверную фильтрацию/сортировку карточек (PrismaCardRepository.search) поверх
 * статичного JSON — чтобы demo-режим отдавал ровно то же, что отдал бы backend на `GET /cards`.
 * Держать в синхроне с apps/backend/.../infrastructure/prisma-card.repository.ts.
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

  return result.sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title));
}

function splitPath(path: string): { segments: string[]; params: URLSearchParams } {
  const [rawPath, rawQuery = ""] = path.split("?");
  const segments = rawPath.split("/").filter(Boolean);
  return { segments, params: new URLSearchParams(rawQuery) };
}

/**
 * Мини-«backend» демо-режима: разбирает путь/метод ровно тех ручек, что использует экран
 * ребёнка, и отвечает из статичного JSON. Всё, что связано с записью на сервер (история,
 * статистика, правки), — no-op: демо только показывает (TASK_DEMO_OFFLINE.md §4).
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

  // --- Ребёнок -------------------------------------------------------------
  if (resource === "children" && method === "GET") {
    if (second) return demoChild as unknown as T;
    return [demoChild] as unknown as T;
  }
  // Правки ребёнка в демо не сохраняются (режим редактирования отключён) — no-op.
  if (resource === "children" && method === "PATCH") {
    return demoChild as unknown as T;
  }

  // --- Избранное -----------------------------------------------------------
  if (resource === "favorites" && method === "GET") {
    const childId = params.get("childId");
    return demoFavorites.filter((f) => f.childId === childId) as unknown as T;
  }
  if (resource === "favorites" && method === "POST") {
    const { childId, cardId } = JSON.parse((options.body as string) ?? "{}");
    const existing = demoFavorites.find((f) => f.childId === childId && f.cardId === cardId);
    if (existing) return existing as unknown as T;
    const favorite: Favorite = {
      id: `demo-fav-${cardId}`,
      childId,
      cardId,
      order: demoFavorites.length,
      createdAt: new Date().toISOString(),
    };
    demoFavorites = [...demoFavorites, favorite];
    return favorite as unknown as T;
  }
  if (resource === "favorites" && method === "DELETE") {
    // /favorites/:childId/:cardId
    demoFavorites = demoFavorites.filter((f) => !(f.childId === second && f.cardId === third));
    return undefined as T;
  }

  // --- Расписание ----------------------------------------------------------
  if (resource === "schedules" && method === "GET") {
    const childId = params.get("childId");
    return demoSchedules.filter((s) => s.childId === childId) as unknown as T;
  }
  if (resource === "schedules" && second === "items" && method === "PATCH") {
    // /schedules/items/:itemId
    const itemId = third;
    const { isCompleted } = JSON.parse((options.body as string) ?? "{}");
    for (const schedule of demoSchedules) {
      const item = schedule.items.find((i) => i.id === itemId);
      if (item) {
        item.isCompleted = Boolean(isCompleted);
        item.completedAt = item.isCompleted ? new Date().toISOString() : null;
        return item as unknown as T;
      }
    }
    return undefined as T;
  }

  // --- Запись на сервер отключена в демо (история/статистика) --------------
  if (resource === "history" || resource === "statistics") {
    return {} as T;
  }

  // Любая другая ручка (авторизация, админка) в демо не должна вызываться — экраны, которые
  // их дергают, в демо не открываются. Явная ошибка помогает поймать пропущенный случай.
  throw new Error(`Демо-режим: запрос ${method} ${path} не поддерживается (backend отключён).`);
}

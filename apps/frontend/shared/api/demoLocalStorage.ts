/**
 * Локальное хранилище офлайн-демо (TASK_DEMO_ENHANCEMENTS.md). Раз бэкенда нет, а порядок
 * карточек/число карточек в ряду/избранное должны переживать перезапуск PWA — состояние живёт
 * в localStorage устройства, а не только в памяти вкладки (в отличие от прежней версии демо,
 * TASK_DEMO_OFFLINE.md §4, где это было намеренным упрощением "хватит на сессию").
 *
 * Два независимых блока, потому что у них разный жизненный цикл:
 *  - "профиль" (порядок карточек по разделам, карточек в ряду, избранное) — это то, что входит
 *    в экспорт/импорт (раздел 4) и переносится между устройствами;
 *  - "состояние расписания" (какие шаги отмечены выполненными сегодня + дата последнего сброса)
 *    — это состояние конкретного "сегодня" на конкретном устройстве, в экспорт НЕ входит
 *    (раздел 5) и сбрасывается по факту открытия приложения в новый день.
 *
 * Всё через try/catch и проверку window — модуль импортируется и во время `next build`
 * (генерация статических страниц на Node, window нет), и в браузере без localStorage
 * (приватный режим Safari) — падать в обоих случаях нельзя, просто работаем как in-memory.
 */

const PROFILE_KEY = "ac-demo-profile:v1";
const SCHEDULE_STATE_KEY = "ac-demo-schedule-state:v1";

// Дефолт локального профиля демо (не серверного Child.cardsPerPage) — 2 карточки в ряду по
// запросу заказчика, крупнее для первого показа; родитель может изменить в режиме редактирования.
const DEFAULT_CARDS_PER_ROW = 2;

export const DEMO_PROFILE_VERSION = 1 as const;

export interface DemoProfileV1 {
  version: 1;
  /** categoryId -> порядок id карточек (drag-reorder, раздел 3). Разделы без записи — порядок
   * по умолчанию (priority/title из демо-JSON). */
  cardOrder: Record<string, string[]>;
  /** Карточек в ряду (колонок) — раздел 2, настраивается в режиме редактирования. */
  cardsPerRow: number;
  /** Id карточек в избранном — порядок в массиве и есть порядок отображения. */
  favoriteCardIds: string[];
}

export interface DemoScheduleStructureItem {
  id: string;
  title: string;
  order: number;
}
export interface DemoScheduleStructure {
  id: string;
  title: string;
  items: DemoScheduleStructureItem[];
}

/** Полный переносимый профиль (раздел 4.1 — "вариант 3"). */
export interface DemoExportBundle {
  version: 1;
  exportedAt: string;
  cardOrder: Record<string, string[]>;
  cardsPerRow: number;
  favoriteCardIds: string[];
  /**
   * Снимок структуры расписания (шаги дня) на момент экспорта — для переносимости между
   * устройствами/сборками демо. Ежедневные отметки выполнения сюда осознанно НЕ входят
   * (раздел 4.1/5 — это состояние "сегодня", а не часть профиля). Сама структура шагов в демо
   * не редактируется (раздел 8: нельзя менять содержимое), поэтому при импорте это поле не
   * применяется активно — оно для информации/сверки, реальная структура всегда берётся из
   * демо-JSON конкретной сборки.
   */
  scheduleStructure: DemoScheduleStructure[];
}

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJSON<T>(key: string): T | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Приватный режим/переполненная квота — молча остаёмся в памяти на этот запуск,
    // это не должно ронять демонстрацию.
  }
}

function defaultProfile(): DemoProfileV1 {
  return { version: 1, cardOrder: {}, cardsPerRow: DEFAULT_CARDS_PER_ROW, favoriteCardIds: [] };
}

function isValidProfileShape(value: unknown): value is DemoProfileV1 {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<DemoProfileV1>;
  return (
    v.version === 1 &&
    typeof v.cardOrder === "object" &&
    v.cardOrder !== null &&
    typeof v.cardsPerRow === "number" &&
    Array.isArray(v.favoriteCardIds)
  );
}

// Кэш в памяти поверх localStorage — читаем диск один раз за сессию, дальше работаем с объектом
// в памяти (и синхронно пишем на диск при каждом изменении, чтобы не потерять состояние).
let cachedProfile: DemoProfileV1 | null = null;

function loadProfile(): DemoProfileV1 {
  if (cachedProfile) return cachedProfile;
  const stored = readJSON<unknown>(PROFILE_KEY);
  cachedProfile = isValidProfileShape(stored) ? stored : defaultProfile();
  return cachedProfile;
}

function saveProfile(next: DemoProfileV1): void {
  cachedProfile = next;
  writeJSON(PROFILE_KEY, next);
}

// --- Порядок карточек (drag-reorder, раздел 3) ------------------------------

export function getCardOrder(categoryId: string): string[] | undefined {
  return loadProfile().cardOrder[categoryId];
}

export function setCardOrder(categoryId: string, orderedCardIds: string[]): void {
  const profile = loadProfile();
  saveProfile({ ...profile, cardOrder: { ...profile.cardOrder, [categoryId]: orderedCardIds } });
}

/** Раскладывает карточки по сохранённому порядку раздела; карточки без записи в порядке
 * (например, порядок ещё не задавали) остаются в исходном относительном порядке в конце. */
export function applyStoredOrder<T extends { id: string }>(categoryId: string, cards: T[]): T[] {
  const order = getCardOrder(categoryId);
  if (!order || order.length === 0) return cards;
  const byId = new Map(cards.map((c) => [c.id, c]));
  const ordered: T[] = [];
  for (const id of order) {
    const card = byId.get(id);
    if (card) {
      ordered.push(card);
      byId.delete(id);
    }
  }
  // Карточки, которых не было в сохранённом порядке (новых в этой сборке демо быть не должно,
  // раздел 8, но на случай рассинхронизации версий) — добавляем в конец, не теряем.
  return [...ordered, ...byId.values()];
}

// --- Карточек в ряду (раздел 2) ----------------------------------------------

export function getCardsPerRow(): number {
  return loadProfile().cardsPerRow;
}

export function setCardsPerRow(value: number): void {
  saveProfile({ ...loadProfile(), cardsPerRow: value });
}

// --- Избранное ----------------------------------------------------------------

export function getFavoriteCardIds(): string[] {
  return loadProfile().favoriteCardIds;
}

export function addFavoriteCardId(cardId: string): void {
  const profile = loadProfile();
  if (profile.favoriteCardIds.includes(cardId)) return;
  saveProfile({ ...profile, favoriteCardIds: [...profile.favoriteCardIds, cardId] });
}

export function removeFavoriteCardId(cardId: string): void {
  const profile = loadProfile();
  saveProfile({ ...profile, favoriteCardIds: profile.favoriteCardIds.filter((id) => id !== cardId) });
}

// --- Расписание: ежедневный сброс (раздел 5) ----------------------------------

interface ScheduleStateV1 {
  /** Календарная дата последнего сброса по ЛОКАЛЬНОМУ времени устройства (YYYY-MM-DD) —
   * сравнение по UTC сбросило бы отметки не в тот момент, когда для пользователя настало утро. */
  lastResetDate: string;
  completed: Record<string, boolean>;
}

function todayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidScheduleState(value: unknown): value is ScheduleStateV1 {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<ScheduleStateV1>;
  return typeof v.lastResetDate === "string" && typeof v.completed === "object" && v.completed !== null;
}

/**
 * "Ленивый" сброс по факту открытия (раздел 5) — сравнивает сохранённую дату с сегодняшней при
 * каждом обращении (а не по таймеру в полночь, которому в офлайн-PWA некому сработать) и
 * обнуляет отметки, если день сменился.
 */
function loadScheduleState(): ScheduleStateV1 {
  const stored = readJSON<unknown>(SCHEDULE_STATE_KEY);
  const today = todayLocalDateString();
  const valid = isValidScheduleState(stored) ? stored : null;

  if (!valid || valid.lastResetDate !== today) {
    const fresh: ScheduleStateV1 = { lastResetDate: today, completed: {} };
    writeJSON(SCHEDULE_STATE_KEY, fresh);
    return fresh;
  }
  return valid;
}

export function getScheduleCompletion(itemId: string): boolean {
  return Boolean(loadScheduleState().completed[itemId]);
}

export function setScheduleCompletion(itemId: string, isCompleted: boolean): void {
  const state = loadScheduleState();
  writeJSON(SCHEDULE_STATE_KEY, { ...state, completed: { ...state.completed, [itemId]: isCompleted } });
}

// --- Экспорт / импорт (раздел 4) ----------------------------------------------

export function buildExportBundle(scheduleStructure: DemoScheduleStructure[]): DemoExportBundle {
  const profile = loadProfile();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    cardOrder: profile.cardOrder,
    cardsPerRow: profile.cardsPerRow,
    favoriteCardIds: profile.favoriteCardIds,
    scheduleStructure,
  };
}

export class DemoImportError extends Error {}

const INVALID_FILE_MESSAGE = "Файл настроек не подходит или повреждён";

/** Проверяет структуру и версию ПЕРЕД применением (раздел 4.3) — намеренно строгая проверка
 * формы каждого поля, а не просто "распарсился JSON", чтобы не записать в localStorage мусор. */
export function parseImportBundle(raw: unknown): DemoExportBundle {
  if (!raw || typeof raw !== "object") throw new DemoImportError(INVALID_FILE_MESSAGE);
  const obj = raw as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new DemoImportError(`${INVALID_FILE_MESSAGE} (неизвестная версия формата)`);
  }
  if (typeof obj.cardOrder !== "object" || obj.cardOrder === null || Array.isArray(obj.cardOrder)) {
    throw new DemoImportError(INVALID_FILE_MESSAGE);
  }
  for (const value of Object.values(obj.cardOrder as Record<string, unknown>)) {
    if (!Array.isArray(value) || !value.every((id) => typeof id === "string")) {
      throw new DemoImportError(INVALID_FILE_MESSAGE);
    }
  }
  if (typeof obj.cardsPerRow !== "number" || !Number.isFinite(obj.cardsPerRow)) {
    throw new DemoImportError(INVALID_FILE_MESSAGE);
  }
  if (!Array.isArray(obj.favoriteCardIds) || !obj.favoriteCardIds.every((id) => typeof id === "string")) {
    throw new DemoImportError(INVALID_FILE_MESSAGE);
  }

  return {
    version: 1,
    exportedAt: typeof obj.exportedAt === "string" ? obj.exportedAt : new Date().toISOString(),
    cardOrder: obj.cardOrder as Record<string, string[]>,
    cardsPerRow: obj.cardsPerRow,
    favoriteCardIds: obj.favoriteCardIds as string[],
    scheduleStructure: Array.isArray(obj.scheduleStructure) ? (obj.scheduleStructure as DemoScheduleStructure[]) : [],
  };
}

export function applyImportedBundle(bundle: DemoExportBundle): void {
  saveProfile({
    version: 1,
    cardOrder: bundle.cardOrder,
    cardsPerRow: bundle.cardsPerRow,
    favoriteCardIds: bundle.favoriteCardIds,
  });
}

// Данные базовой библиотеки категорий-глаголов и карточек — редакция 3 механики
// (TASK_REVISE_MECHANICS_AND_ADMIN.md §A). Эти данные используются ТОЛЬКО seed-скриптом
// (packages/database/prisma/seed.ts) — после первого запуска редактирование происходит
// через админку/API, а не правкой этого файла.
//
// ВАЖНО про контент ниже: набор существительных на категорию (6 шт.) и конкретные
// sentenceTemplate — временный, демонстрационный набор с безопасными дефолтами.
// Финальное наполнение "Идти"/"Мыться" и точные шаблоны фраз для "Болит"/"Дай" —
// открытые вопросы к заказчику (см. отчёт по задаче), не финальное решение.

export type CardGender = "MASCULINE" | "FEMININE" | "NEUTER";

export interface SeedNounCard {
  title: string; // именительный падеж
  phraseForm: string; // словоформа для вставки во фразу
  gender: CardGender;
}

export interface SeedVerbCategory {
  slug: string;
  title: string; // сам глагол/просьба: "Дай", "Болит", ...
  icon: string;
  order: number;
  color: string;
  isPrimary?: boolean;
  phraseForm: string; // словоформа 1-го лица: "Есть" -> "Ем"
  sentenceTemplate: string;
  nouns: SeedNounCard[];
}

// Дефолтный шаблон "{verb} {noun}" — безопасный, но не всегда естественный
// (см. §A.3 задачи: не додумывать финальные шаблоны самостоятельно).
const DEFAULT_TEMPLATE = "{verb} {noun}";

export const seedVerbCategories: SeedVerbCategory[] = [
  {
    slug: "give",
    title: "Дай",
    icon: "gift",
    order: 1,
    color: "#4F46E5",
    isPrimary: true,
    phraseForm: "Дай",
    sentenceTemplate: DEFAULT_TEMPLATE,
    nouns: [
      { title: "Мяч", phraseForm: "мяч", gender: "MASCULINE" },
      { title: "Сок", phraseForm: "сок", gender: "MASCULINE" },
      { title: "Игрушка", phraseForm: "игрушку", gender: "FEMININE" },
      { title: "Печенье", phraseForm: "печенье", gender: "NEUTER" },
      { title: "Вода", phraseForm: "воду", gender: "FEMININE" },
      { title: "Книга", phraseForm: "книгу", gender: "FEMININE" },
      // Дополнительно — для демонстрации согласования прилагательных (см. README прилагательных ниже).
      { title: "Шар", phraseForm: "шар", gender: "MASCULINE" },
      { title: "Машина", phraseForm: "машину", gender: "FEMININE" },
    ],
  },
  {
    slug: "hurts",
    title: "Болит",
    icon: "stethoscope",
    order: 2,
    color: "#9B1C1C",
    phraseForm: "Болит",
    // ВНИМАНИЕ: "болит" грамматически требует именительный падеж ("болит живот"),
    // а не винительный, как большинство остальных категорий. phraseForm у карточек
    // ниже намеренно совпадает с title (именительный) — это осознанное расхождение
    // с общим полем "словоформа для вставки", требует подтверждения у заказчика.
    sentenceTemplate: DEFAULT_TEMPLATE,
    nouns: [
      { title: "Живот", phraseForm: "живот", gender: "MASCULINE" },
      { title: "Голова", phraseForm: "голова", gender: "FEMININE" },
      { title: "Зуб", phraseForm: "зуб", gender: "MASCULINE" },
      { title: "Горло", phraseForm: "горло", gender: "NEUTER" },
      { title: "Ухо", phraseForm: "ухо", gender: "NEUTER" },
      { title: "Нога", phraseForm: "нога", gender: "FEMININE" },
    ],
  },
  {
    slug: "go",
    title: "Идти",
    icon: "run",
    order: 3,
    color: "#2F4F8C",
    // Форма глагола — совместное побуждение "Идём" (по запросу заказчика заменено с более
    // раннего "Пойдём"). Предлог и падеж зависят от конкретного существительного ("во двор",
    // но "в школу", "домой") — не выводятся по правилу для всей категории, поэтому предлог+падеж
    // зашиты целиком в phraseForm каждой карточки, а sentenceTemplate остаётся "{verb} {noun}"
    // (сам движок шаблонов не менялся, вся коррекция — в данных). Итог: "Идём в магазин",
    // "Идём домой", "Идём в парк".
    phraseForm: "Идём",
    sentenceTemplate: DEFAULT_TEMPLATE,
    nouns: [
      { title: "Парк", phraseForm: "в парк", gender: "MASCULINE" },
      { title: "Магазин", phraseForm: "в магазин", gender: "MASCULINE" },
      // "Домой", не "в дом" — стандартная идиома для "идти домой" в русском.
      { title: "Дом", phraseForm: "домой", gender: "MASCULINE" },
      { title: "Улица", phraseForm: "на улицу", gender: "FEMININE" },
      { title: "Школа", phraseForm: "в школу", gender: "FEMININE" },
      { title: "Двор", phraseForm: "во двор", gender: "MASCULINE" },
    ],
  },
  {
    slug: "eat",
    title: "Есть",
    icon: "apple",
    order: 4,
    color: "#712B13",
    phraseForm: "Ем",
    sentenceTemplate: DEFAULT_TEMPLATE,
    nouns: [
      { title: "Яблоко", phraseForm: "яблоко", gender: "NEUTER" },
      { title: "Банан", phraseForm: "банан", gender: "MASCULINE" },
      { title: "Каша", phraseForm: "кашу", gender: "FEMININE" },
      { title: "Суп", phraseForm: "суп", gender: "MASCULINE" },
      { title: "Йогурт", phraseForm: "йогурт", gender: "MASCULINE" },
      { title: "Хлеб", phraseForm: "хлеб", gender: "MASCULINE" },
    ],
  },
  {
    // slug остаётся "wash" (детерминированный id категории привязан к нему) — так seed
    // обновляет ту же категорию на месте, а не создаёт новую рядом со старой "Мыться".
    slug: "wash",
    title: "Гигиена",
    icon: "bath",
    order: 5,
    color: "#0E6B6B",
    // По запросу заказчика раздел переименован из "Мыться" в "Гигиена", а карточки-объекты
    // (лицо/рука/…) заменены на самостоятельные действия: "Туалет", "Мыться", "Чистить зубы".
    // Это разнородные по грамматике элементы (существительное + два глагольных оборота) без
    // общего глагола-связки, поэтому категория озвучивает карточку саму по себе: phraseForm
    // категории пустой, а sentenceTemplate = "{noun}" (тап по "Чистить зубы" произносит
    // "чистить зубы", без приставки-глагола впереди). gender у этих карточек не несёт смысла
    // (согласование прилагательного здесь не применяется) — проставлен нейтральный дефолт.
    phraseForm: "",
    sentenceTemplate: "{noun}",
    nouns: [
      { title: "Туалет", phraseForm: "туалет", gender: "MASCULINE" },
      { title: "Мыться", phraseForm: "мыться", gender: "MASCULINE" },
      { title: "Чистить зубы", phraseForm: "чистить зубы", gender: "MASCULINE" },
    ],
  },
];

export interface SeedAdjectiveCard {
  title: string; // словарная форма (муж. род, им. падеж)
  masculine: string;
  feminine: string;
  neuter: string;
  color: string;
}

// Набор прилагательных НЕ курируется как закрытый список (решение заказчика, редакция 3) —
// это лишь стартовый демонстрационный набор для уровня сложности 3.
export const seedAdjectives: SeedAdjectiveCard[] = [
  { title: "Зелёный", masculine: "зелёный", feminine: "зелёная", neuter: "зелёное", color: "#166534" },
  { title: "Большой", masculine: "большой", feminine: "большая", neuter: "большое", color: "#7C3AED" },
  { title: "Красный", masculine: "красный", feminine: "красная", neuter: "красное", color: "#B91C1C" },
];

// Редакция 2 патча (TASK_PATCH_1.md §3): заказчик поменял решение на противоположное —
// Да теперь синяя, Нет — красная (ближе к общепринятой AAC-конвенции, где красный = "нет").
export const YES_CARD = { title: "Да", ttsText: "Да", color: "#1D4ED8" };
export const NO_CARD = { title: "Нет", ttsText: "Нет", color: "#B91C1C" };

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "");
}

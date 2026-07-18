// Данные базовой библиотеки категорий и карточек. Используются ТОЛЬКО seed-скриптом
// (packages/database/prisma/seed.ts) — после первого запуска редактирование происходит через
// админку/API, а не правкой этого файла.
//
// Редакция 4 (TASK_GRID_AND_TTS.md, часть B): фраза озвучивания задаётся на КАЖДОЙ карточке
// целиком в поле `ttsPhrase` — родитель пишет готовую грамматически верную фразу, приложение
// не собирает её из частей. Это закрывает прежние грамматические сложности (безличное "Болит",
// повелительное "Дай", предлоги движения "во двор"). Поля `phraseForm`/`sentenceTemplate`
// категории остались в схеме, но для озвучивания больше не используются.

export type CardGender = "MASCULINE" | "FEMININE" | "NEUTER";

export interface SeedNounCard {
  title: string; // короткая подпись на плитке (именительный падеж): "Двор"
  ttsPhrase: string; // полная фраза озвучивания: "Идём во двор"
  phraseForm: string; // легаси (прежняя сборка фразы) — оставлено для истории, для TTS не нужно
  gender: CardGender;
}

export interface SeedVerbCategory {
  slug: string;
  title: string; // название раздела: "Дай", "Гигиена", ...
  icon: string;
  order: number;
  color: string;
  isPrimary?: boolean;
  phraseForm: string; // легаси (словоформа 1-го лица) — для TTS больше не источник
  sentenceTemplate: string; // легаси — для TTS больше не источник
  nouns: SeedNounCard[];
}

// Легаси-шаблон — больше не участвует в озвучивании (фраза берётся из Card.ttsPhrase).
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
      { title: "Мяч", ttsPhrase: "Дай мяч", phraseForm: "мяч", gender: "MASCULINE" },
      { title: "Сок", ttsPhrase: "Дай сок", phraseForm: "сок", gender: "MASCULINE" },
      { title: "Игрушка", ttsPhrase: "Дай игрушку", phraseForm: "игрушку", gender: "FEMININE" },
      { title: "Печенье", ttsPhrase: "Дай печенье", phraseForm: "печенье", gender: "NEUTER" },
      { title: "Вода", ttsPhrase: "Дай воду", phraseForm: "воду", gender: "FEMININE" },
      { title: "Книга", ttsPhrase: "Дай книгу", phraseForm: "книгу", gender: "FEMININE" },
      { title: "Шар", ttsPhrase: "Дай шар", phraseForm: "шар", gender: "MASCULINE" },
      { title: "Машина", ttsPhrase: "Дай машину", phraseForm: "машину", gender: "FEMININE" },
    ],
  },
  {
    slug: "hurts",
    title: "Болит",
    icon: "stethoscope",
    order: 2,
    color: "#9B1C1C",
    phraseForm: "Болит",
    sentenceTemplate: DEFAULT_TEMPLATE,
    nouns: [
      { title: "Живот", ttsPhrase: "Болит живот", phraseForm: "живот", gender: "MASCULINE" },
      { title: "Голова", ttsPhrase: "Болит голова", phraseForm: "голова", gender: "FEMININE" },
      { title: "Зуб", ttsPhrase: "Болит зуб", phraseForm: "зуб", gender: "MASCULINE" },
      { title: "Горло", ttsPhrase: "Болит горло", phraseForm: "горло", gender: "NEUTER" },
      { title: "Ухо", ttsPhrase: "Болит ухо", phraseForm: "ухо", gender: "NEUTER" },
      { title: "Нога", ttsPhrase: "Болит нога", phraseForm: "нога", gender: "FEMININE" },
    ],
  },
  {
    slug: "go",
    title: "Идти",
    icon: "run",
    order: 3,
    color: "#2F4F8C",
    phraseForm: "Идём",
    sentenceTemplate: DEFAULT_TEMPLATE,
    nouns: [
      { title: "Парк", ttsPhrase: "Идём в парк", phraseForm: "в парк", gender: "MASCULINE" },
      { title: "Магазин", ttsPhrase: "Идём в магазин", phraseForm: "в магазин", gender: "MASCULINE" },
      { title: "Дом", ttsPhrase: "Идём домой", phraseForm: "домой", gender: "MASCULINE" },
      { title: "Улица", ttsPhrase: "Идём на улицу", phraseForm: "на улицу", gender: "FEMININE" },
      { title: "Школа", ttsPhrase: "Идём в школу", phraseForm: "в школу", gender: "FEMININE" },
      { title: "Двор", ttsPhrase: "Идём во двор", phraseForm: "во двор", gender: "MASCULINE" },
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
      { title: "Яблоко", ttsPhrase: "Ем яблоко", phraseForm: "яблоко", gender: "NEUTER" },
      { title: "Банан", ttsPhrase: "Ем банан", phraseForm: "банан", gender: "MASCULINE" },
      { title: "Каша", ttsPhrase: "Ем кашу", phraseForm: "кашу", gender: "FEMININE" },
      { title: "Суп", ttsPhrase: "Ем суп", phraseForm: "суп", gender: "MASCULINE" },
      { title: "Йогурт", ttsPhrase: "Ем йогурт", phraseForm: "йогурт", gender: "MASCULINE" },
      { title: "Хлеб", ttsPhrase: "Ем хлеб", phraseForm: "хлеб", gender: "MASCULINE" },
    ],
  },
  {
    // slug остаётся "wash" (детерминированный id категории привязан к нему) — seed обновляет
    // ту же категорию на месте, а не создаёт новую рядом со старой "Мыться".
    slug: "wash",
    title: "Гигиена",
    icon: "bath",
    order: 5,
    color: "#0E6B6B",
    // Раздел гигиены — самостоятельные действия; фраза озвучивания у каждой карточки своя
    // (в редакции 4 это норма для всех разделов, не исключение).
    phraseForm: "",
    sentenceTemplate: "{noun}",
    nouns: [
      { title: "Туалет", ttsPhrase: "Хочу в туалет", phraseForm: "туалет", gender: "MASCULINE" },
      { title: "Мыться", ttsPhrase: "Хочу мыться", phraseForm: "мыться", gender: "MASCULINE" },
      { title: "Чистить зубы", ttsPhrase: "Хочу чистить зубы", phraseForm: "чистить зубы", gender: "MASCULINE" },
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

// Редакция 2 патча (TASK_PATCH_1.md §3): Да синяя, Нет — красная (AAC-конвенция: красный = "нет").
export const YES_CARD = { title: "Да", ttsText: "Да", color: "#1D4ED8" };
export const NO_CARD = { title: "Нет", ttsText: "Нет", color: "#B91C1C" };

// Имя файла-иллюстрации в packages/database/seed-assets/cards/ для карточек, у которых есть
// готовая базовая картинка (запрос заказчика — библиотека не должна оставаться без фото "из
// коробки"). Не все карточки покрыты — для отсутствующих здесь ключей seed.ts просто не трогает
// imageUrl. Единственное место, где живёт это соответствие — используется seed.ts, чтобы базовые
// картинки применялись автоматически при обычном `prisma db seed`, без отдельного ручного шага.
export const CARD_IMAGE_FILES: Record<string, string> = {
  Мяч: "myach.png",
  Сок: "sok.png",
  Игрушка: "igrushka.png",
  Печенье: "pechenye.png",
  Вода: "voda.png",
  Книга: "kniga.png",
  Шар: "shar.png",
  Машина: "mashina.png",
  Живот: "zhivot.png",
  Голова: "golova.png",
  Зуб: "zub.png",
  Горло: "gorlo.png",
  Ухо: "ukho.png",
  Нога: "noga.png",
  Парк: "park.png",
  Магазин: "magazin.png",
  Дом: "dom.png",
  Улица: "ulitsa.png",
  Школа: "shkola.png",
  Двор: "dvor.png",
  Яблоко: "yabloko.png",
  Банан: "banan.png",
  Каша: "kasha.png",
  Суп: "sup.png",
  Йогурт: "yogurt.png",
  Хлеб: "khleb.png",
  Туалет: "tualet.png",
  Мыться: "mytsya.png",
  "Чистить зубы": "chistit-zuby.png",
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "");
}

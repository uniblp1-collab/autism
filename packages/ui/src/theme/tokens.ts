// Дизайн-токены Autism Connect — переносятся буквально из DESIGN.md, не приближённо.
// Единственный источник цветов/радиусов/отступов для UI-хрома; цвет конкретной
// карточки/категории — данные из БД (см. resolveCategoryColorToken ниже), не хардкод.

export const fontFamily = "'Nunito', 'Inter', system-ui, sans-serif";

// DESIGN.md §5: подпись карточки — 20-22px/500 на реальном планшете (демо-рендер
// был сжат под canvas 680px). Карточка — не менее 96×96px (строже, чем прежние 88px).
export const MIN_TOUCH_TARGET_PX = 96;

export const radiusTokens = {
  sm: 10,
  md: 14,
  lg: 16,
  full: 999,
} as const;

export const spacingTokens = {
  xs: 8,
  sm: 10,
  md: 16,
  lg: 24,
} as const;

export const paddingTokens = {
  tile: "16px 8px",
  panel: "20px",
} as const;

// DESIGN.md §5 — типографический масштаб. Только два начертания во всём приложении: 400 и 500.
export const typeScale = {
  metricNumber: { size: 24, weight: 500 },
  cardLabel: { size: 21, weight: 500 },
  speakButton: { size: 16, weight: 500 },
  categoryPill: { size: 14, weight: 400 },
  categoryPillActive: { size: 14, weight: 500 },
  blockLabel: { size: 13.5, weight: 500 },
  caption: { size: 12, weight: 400 },
} as const;

export const themeTokens = {
  standard: {
    background: "#F7F6F2", // surface-page
    surface: "#FFFFFF", // surface-panel
    surfaceMuted: "#F1EFE8", // surface-muted
    textPrimary: "#2C2C2A",
    textSecondary: "#5F5E5A",
    textMuted: "#888780",
    border: "#D3D1C7",
    accent: "#378ADD", // accent-fill (заливка кнопки "Озвучить")
    accentSoft: "#E6F1FB", // accent-50
    accentText: "#185FA5", // accent-600
    accentBorder: "#185FA5",
    focusRing: "#185FA5",
    success: "#EAF3DE",
    successText: "#27500A",
    danger: "#B91C1C",
    // Значок «избранное» на карточке (TASK_PATCH_1.md §2) — отдельный токен, не переиспользует
    // цвет какой-либо предметной категории (совпадение с "Эмоции" было бы случайным).
    favoriteFill: "#FAC775",
    favoriteText: "#7A4A06",
  },
  // Усиленный вариант той же палитры (толще границы, темнее текст) — DESIGN.md
  // не описывает отдельную высококонтрастную тему, поэтому она не переизобретает
  // цвета, а лишь ужесточает контраст в рамках того же тёплого нейтрального фона.
  highContrast: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceMuted: "#EDEBE3",
    textPrimary: "#000000",
    textSecondary: "#2C2C2A",
    textMuted: "#4A4944",
    border: "#000000",
    accent: "#185FA5",
    accentSoft: "#E6F1FB",
    accentText: "#0B3A66",
    accentBorder: "#0B3A66",
    focusRing: "#0B3A66",
    success: "#EAF3DE",
    successText: "#1B3A07",
    danger: "#8C1414",
    favoriteFill: "#F5B942",
    favoriteText: "#4A2E03",
  },
} as const;

export type ThemeMode = keyof typeof themeTokens;
export type ThemeTokens = (typeof themeTokens)[ThemeMode];

export interface CategoryColorToken {
  bg: string;
  fg: string;
}

// DESIGN.md §3.4 — формула "фон 100 / текст 800", ключ — это ЦВЕТ категории (Card.color
// из БД), а не её название: так любая новая категория, добавленная через админку без кода,
// либо совпадёт с одним из зафиксированных тонов, либо получит вычисленную пару (см. ниже).
export const categoryColorTokens: Record<string, CategoryColorToken> = {
  "#712B13": { bg: "#F5C4B3", fg: "#712B13" }, // Еда
  "#085041": { bg: "#9FE1CB", fg: "#085041" }, // Напитки
  "#3C3489": { bg: "#CECBF6", fg: "#3C3489" }, // Игрушки
  "#72243E": { bg: "#F4C0D1", fg: "#72243E" }, // Семья
  "#791F1F": { bg: "#F7C1C1", fg: "#791F1F" }, // Действия
  "#633806": { bg: "#FAC775", fg: "#633806" }, // Эмоции
  "#27500A": { bg: "#C0DD97", fg: "#27500A" }, // Животные (и временно "Природа", см. DESIGN.md §3.4)
  "#444441": { bg: "#D3D1C7", fg: "#444441" }, // Одежда
  "#0C447C": { bg: "#B5D4F4", fg: "#0C447C" }, // Транспорт
  // Служебные карточки Да/Нет (isSystemCard) — редакция 3 механики, часть A.6.
  // Цвета зафиксированы отдельно от 9 базовых категорий: Да — красный, Нет — синий.
  "#B91C1C": { bg: "#F6C6C6", fg: "#7A1414" }, // Да
  "#1D4ED8": { bg: "#C6D8FA", fg: "#1E3A8A" }, // Нет
};

function mixWithWhite(hex: string, whiteRatio: number): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const mix = (channel: number) => Math.round(channel + (255 - channel) * whiteRatio);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Разрешает пару фон/текст для карточки/пилюли категории по её цвету из БД.
 * Для 9 базовых категорий ТЗ возвращает зафиксированные в DESIGN.md значения буквально;
 * для любой другой категории, добавленной через админку, вычисляет светлый фон из того же
 * тона по формуле осветления — правило переиспользуется, а не подбирается на глаз.
 */
export function resolveCategoryColorToken(color: string): CategoryColorToken {
  const known = categoryColorTokens[color.toUpperCase()] ?? categoryColorTokens[color];
  if (known) return known;
  return { bg: mixWithWhite(color, 0.82), fg: color };
}

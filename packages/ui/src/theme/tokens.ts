// Единственный источник цветовых токенов для UI-хрома (не для контента карточек —
// цвет карточки приходит из данных БД и передаётся отдельным пропом accentColor).
// Все токены подобраны так, чтобы гарантировать контраст текста к фону не хуже WCAG AA (4.5:1).

export const themeTokens = {
  standard: {
    background: "#FFFFFF",
    surface: "#F3F4F6",
    textPrimary: "#111827",
    textSecondary: "#374151",
    border: "#D1D5DB",
    accent: "#4F46E5",
    accentText: "#FFFFFF",
    focusRing: "#2563EB",
    success: "#15803D",
    danger: "#B91C1C",
  },
  highContrast: {
    background: "#000000",
    surface: "#0A0A0A",
    textPrimary: "#FFFFFF",
    textSecondary: "#FFFF00",
    border: "#FFFFFF",
    accent: "#FFFF00",
    accentText: "#000000",
    focusRing: "#00FFFF",
    success: "#22C55E",
    danger: "#FF4D4D",
  },
} as const;

export type ThemeMode = keyof typeof themeTokens;
export type ThemeTokens = (typeof themeTokens)[ThemeMode];

// Минимальный тач-таргет для интерактивных элементов зоны ребёнка (раздел 8 ТЗ).
export const MIN_TOUCH_TARGET_PX = 88;

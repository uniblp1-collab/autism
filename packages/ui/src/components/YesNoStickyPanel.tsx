"use client";

import { radiusTokens, resolveCategoryColorToken } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";
import { Icon } from "./Icon";

export interface SystemCard {
  id: string;
  title: string;
  color: string;
}

export interface YesNoStickyPanelProps {
  yesCard: SystemCard;
  noCard: SystemCard;
  onSelect: (card: SystemCard) => void;
}

/**
 * Отдельная липкая панель Да/Нет (ТЗ, часть A.6): эти две карточки — isSystemCard,
 * не входят в сетку категории и не участвуют в конструкторе предложения — озвучиваются
 * мгновенно по тапу. Подпись и цвет приходят из карточек через API, а не хардкодятся здесь.
 *
 * Порядок слева направо (редакция 3 патча): Да → Нет. Цвета — из самих карточек (Да
 * синяя, Нет красная, см. seed-data.ts), порядок задаётся здесь, а не позицией
 * карточек в ответе API.
 */
export function YesNoStickyPanel({ yesCard, noCard, onSelect }: YesNoStickyPanelProps) {
  const { tokens } = useTheme();
  const yesTone = resolveCategoryColorToken(yesCard.color);
  const noTone = resolveCategoryColorToken(noCard.color);

  return (
    <div
      className="sticky bottom-0 z-10 flex items-center justify-center gap-4 py-3"
      style={{ backgroundColor: tokens.surface, borderTop: `1px solid ${tokens.border}` }}
    >
      <button
        type="button"
        onClick={() => onSelect(yesCard)}
        className="flex items-center gap-2 px-8 py-3 focus:outline-none focus-visible:ring-4"
        style={{
          backgroundColor: yesTone.bg,
          color: yesTone.fg,
          borderRadius: radiusTokens.full,
          fontSize: 18,
          fontWeight: 500,
          // @ts-expect-error CSS custom property for focus ring color
          "--tw-ring-color": tokens.focusRing,
        }}
      >
        <Icon name="check" size={22} />
        {yesCard.title}
      </button>
      <button
        type="button"
        onClick={() => onSelect(noCard)}
        className="flex items-center gap-2 px-8 py-3 focus:outline-none focus-visible:ring-4"
        style={{
          backgroundColor: noTone.bg,
          color: noTone.fg,
          borderRadius: radiusTokens.full,
          fontSize: 18,
          fontWeight: 500,
          // @ts-expect-error CSS custom property for focus ring color
          "--tw-ring-color": tokens.focusRing,
        }}
      >
        <Icon name="x" size={22} />
        {noCard.title}
      </button>
    </div>
  );
}

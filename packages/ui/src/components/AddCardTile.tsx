"use client";

import { MIN_TOUCH_TARGET_PX, paddingTokens, radiusTokens } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";
import { Icon } from "./Icon";

export interface AddCardTileProps {
  label?: string;
  onClick: () => void;
}

/**
 * Пунктирная плитка «Добавить карточку» в конце сетки категории — видна только
 * в режиме редактирования (ТЗ, часть A.7). Размер/отступы совпадают с CardButton,
 * чтобы плитка не «прыгала» в сетке при переключении режима.
 */
export function AddCardTile({ label = "Добавить", onClick }: AddCardTileProps) {
  const { tokens } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed focus:outline-none focus-visible:ring-4"
      style={{
        minWidth: MIN_TOUCH_TARGET_PX,
        minHeight: MIN_TOUCH_TARGET_PX,
        borderRadius: radiusTokens.md,
        borderColor: tokens.border,
        color: tokens.textMuted,
        padding: paddingTokens.tile,
        // @ts-expect-error CSS custom property for focus ring color
        "--tw-ring-color": tokens.focusRing,
      }}
    >
      <Icon name="plus" size={28} />
      <span className="text-center" style={{ fontSize: 14, fontWeight: 400 }}>
        {label}
      </span>
    </button>
  );
}

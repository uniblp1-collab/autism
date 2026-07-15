"use client";

import { MIN_TOUCH_TARGET_PX, paddingTokens, radiusTokens } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";
import { Icon } from "./Icon";

export interface AddCardTileProps {
  label?: string;
  onClick: () => void;
  size?: "small" | "medium" | "large";
}

/**
 * Пунктирная плитка «Добавить карточку» в конце сетки категории — видна только
 * в режиме редактирования (ТЗ, часть A.7). Размер/отступы совпадают с CardButton
 * (тот же `size`, фиксированный px, без растягивания на всю ширину контейнера —
 * сетка теперь flex-wrap, см. TASK_PATCH_3), чтобы плитка не «прыгала» рядом с карточками.
 */
export function AddCardTile({ label = "Добавить", onClick, size = "small" }: AddCardTileProps) {
  const { tokens } = useTheme();
  const dimension =
    size === "large" ? MIN_TOUCH_TARGET_PX * 1.4 : size === "medium" ? MIN_TOUCH_TARGET_PX * 1.2 : MIN_TOUCH_TARGET_PX;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed focus:outline-none focus-visible:ring-4"
      style={{
        width: dimension,
        height: dimension,
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

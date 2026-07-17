"use client";

import { paddingTokens, radiusTokens } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";
import { Icon } from "./Icon";

export interface AddCardTileProps {
  label?: string;
  onClick: () => void;
}

/**
 * Пунктирная плитка «Добавить карточку» в конце сетки категории — видна только в режиме
 * редактирования (ТЗ, часть A.7). Заполняет ячейку адаптивной сетки и квадратная, как CardButton
 * (TASK_GRID_AND_TTS.md §A), чтобы не «прыгать» рядом с карточками.
 */
export function AddCardTile({ label = "Добавить", onClick }: AddCardTileProps) {
  const { tokens } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed focus:outline-none focus-visible:ring-4"
      style={{
        aspectRatio: "1",
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

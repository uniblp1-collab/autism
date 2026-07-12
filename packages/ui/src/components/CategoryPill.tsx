"use client";

import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { radiusTokens, resolveCategoryColorToken } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";
import { Icon } from "./Icon";

export interface CategoryPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: string;
  /** Цвет категории из БД; используется только когда пилюля активна (DESIGN.md §6.2). */
  color: string;
  active?: boolean;
  /** Категория "Дай" (Category.isPrimary) — всегда в акцентном цвете, даже не выбранная (ТЗ, часть A.2). */
  isPrimary?: boolean;
}

/** Пилюля переключения категории/избранного/расписания в зоне ребёнка (DESIGN.md §6.2). */
export function CategoryPill({ label, icon, color, active, isPrimary, className, ...rest }: CategoryPillProps) {
  const { tokens } = useTheme();
  const activeTone = resolveCategoryColorToken(color);
  const useAccentTone = active || isPrimary;

  return (
    <button
      type="button"
      aria-pressed={active}
      className={clsx("flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2", className)}
      style={{
        borderRadius: radiusTokens.full,
        backgroundColor: useAccentTone ? activeTone.bg : tokens.surfaceMuted,
        color: useAccentTone ? activeTone.fg : tokens.textSecondary,
        fontSize: 14,
        fontWeight: useAccentTone ? 500 : 400,
        border: isPrimary ? `2px solid ${activeTone.fg}` : "none",
      }}
      {...rest}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}

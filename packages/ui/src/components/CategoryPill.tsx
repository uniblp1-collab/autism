"use client";

import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { radiusTokens, resolveCategoryColorToken } from "../theme/tokens";
import { Icon } from "./Icon";

export interface CategoryPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: string;
  /** Цвет категории из БД — теперь это её базовый цвет, показывается всегда, а не только
   * когда пилюля активна (по запросу заказчика: цвет должен быть виден по умолчанию). */
  color: string;
  active?: boolean;
  /** Категория "Дай" (Category.isPrimary) — всегда с рамкой-подсветкой, даже не выбранная (ТЗ, часть A.2). */
  isPrimary?: boolean;
  /** Скрывает текстовую подпись, оставляя только иконку — служебные пилюли «Избранное»/
   * «Расписание» узнаваемы по одной иконке без текста. `label` всё равно обязателен —
   * используется как aria-label кнопки, чтобы её по-прежнему могли озвучить скринридеры. */
  showLabel?: boolean;
}

/** Пилюля переключения категории/избранного/расписания в зоне ребёнка (DESIGN.md §6.2). */
export function CategoryPill({
  label,
  icon,
  color,
  active,
  isPrimary,
  showLabel = true,
  className,
  ...rest
}: CategoryPillProps) {
  const tone = resolveCategoryColorToken(color);
  // "Явно показать, что выбрал ребёнок" (запрос заказчика): цвет теперь base-визуал пилюли
  // всегда, поэтому активную вкладку от остальных отличает не цвет (он одинаков), а рамка +
  // жирное начертание — тот же приём, что раньше был только у isPrimary ("Дай").
  const isMarked = active || isPrimary;

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={showLabel ? undefined : label}
      className={clsx("flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-2", className)}
      style={{
        borderRadius: radiusTokens.full,
        backgroundColor: tone.bg,
        color: tone.fg,
        fontSize: 14,
        fontWeight: isMarked ? 500 : 400,
        border: isMarked ? `2px solid ${tone.fg}` : "none",
      }}
      {...rest}
    >
      <Icon name={icon} size={16} />
      {showLabel ? label : null}
    </button>
  );
}

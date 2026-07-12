"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { MIN_TOUCH_TARGET_PX, paddingTokens, radiusTokens, resolveCategoryColorToken } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";
import { Icon } from "./Icon";

export interface CardButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  /** Подпись карточки (sentence case, напр. «Позавтракать») — DESIGN.md §1. */
  title: string;
  /** URL изображения карточки; данные из БД/MinIO, не хардкод. */
  imageUrl?: string | null;
  /** Цвет категории карточки из БД — 800-й тон; фон вычисляется по формуле DESIGN.md §3.4. */
  accentColor: string;
  /** Ключ иконки из реестра Tabler Icons — резервный визуал, пока нет imageUrl. */
  icon?: string;
  selected?: boolean;
  size?: "default" | "large";
  /** Показывает кнопку-крестик поверх карточки — только в режиме редактирования (ТЗ, часть A.7). */
  onDelete?: () => void;
}

/**
 * Единственный способ отрисовать кликабельную карточку в зоне ребёнка (DESIGN.md §6.3).
 * Плоский дизайн: заливка category-100, подпись/иконка — category-800, без теней и градиентов.
 */
export const CardButton = forwardRef<HTMLButtonElement, CardButtonProps>(
  ({ title, imageUrl, accentColor, icon, selected, size = "default", onDelete, className, ...rest }, ref) => {
    const { tokens } = useTheme();
    const dimension = size === "large" ? MIN_TOUCH_TARGET_PX * 1.4 : MIN_TOUCH_TARGET_PX;
    const { bg, fg } = resolveCategoryColorToken(accentColor);

    const button = (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={clsx(
          "flex flex-col items-center justify-center gap-2",
          "transition-transform duration-150 ease-out active:scale-95",
          "focus:outline-none focus-visible:ring-4",
          className,
        )}
        style={{
          minWidth: dimension,
          minHeight: dimension,
          backgroundColor: bg,
          color: fg,
          borderRadius: radiusTokens.md,
          padding: paddingTokens.tile,
          border: selected ? `2px solid ${fg}` : "none",
          // @ts-expect-error CSS custom property for focus ring color
          "--tw-ring-color": tokens.focusRing,
        }}
        {...rest}
      >
        {imageUrl ? (
          // Ленивая загрузка вне видимой области — бюджет производительности (ARCHITECTURE.md §7).
          // eslint-disable-next-line @next/next/no-img-element -- packages/ui не зависит от next/image
          <img src={imageUrl} alt="" loading="lazy" className="h-10 w-10 object-contain sm:h-12 sm:w-12" />
        ) : icon ? (
          <Icon name={icon} size={32} />
        ) : null}
        <span className="text-center" style={{ fontSize: 21, fontWeight: 500 }}>
          {title}
        </span>
      </button>
    );

    if (!onDelete) return button;

    // Крестик — отдельная кнопка поверх карточки, а не вложенная внутрь неё
    // (вложенные <button> недопустимы), поэтому оборачиваем в relative-контейнер только
    // в режиме редактирования — обычный (не редактируемый) рендер разметку не меняет.
    return (
      <div className="relative inline-flex">
        {button}
        <button
          type="button"
          aria-label={`Удалить карточку «${title}»`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-4"
          style={{
            backgroundColor: tokens.danger,
            color: "#FFFFFF",
            // @ts-expect-error CSS custom property for focus ring color
            "--tw-ring-color": tokens.focusRing,
          }}
        >
          <Icon name="x" size={16} strokeWidth={2.5} />
        </button>
      </div>
    );
  },
);

CardButton.displayName = "CardButton";

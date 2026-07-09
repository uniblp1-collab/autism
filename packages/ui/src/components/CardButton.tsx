"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { MIN_TOUCH_TARGET_PX } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";

export interface CardButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  /** Заголовок карточки (подпись под изображением). */
  title: string;
  /** URL изображения карточки; если не задан — показывается только текст/иконка. */
  imageUrl?: string | null;
  /** Цвет акцента карточки — это ДАННЫЕ (из БД/админки), а не хардкод компонента. */
  accentColor?: string;
  /** Выбрана ли карточка (например, уже добавлена в собираемое предложение). */
  selected?: boolean;
  size?: "default" | "large";
}

/**
 * Единственный способ отрисовать кликабельную карточку в зоне ребёнка.
 * Гарантирует минимальный тач-таргет и запрещает мигающие анимации —
 * разработчик физически не может обойти эти ограничения, описывая карточку инлайн.
 */
export const CardButton = forwardRef<HTMLButtonElement, CardButtonProps>(
  ({ title, imageUrl, accentColor, selected, size = "default", className, ...rest }, ref) => {
    const { tokens } = useTheme();
    const dimension = size === "large" ? MIN_TOUCH_TARGET_PX * 1.4 : MIN_TOUCH_TARGET_PX;

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={clsx(
          "flex flex-col items-center justify-center gap-1 rounded-2xl border-4 p-2",
          "transition-transform duration-150 ease-out active:scale-95",
          "focus:outline-none focus-visible:ring-4",
          className,
        )}
        style={{
          minWidth: dimension,
          minHeight: dimension,
          backgroundColor: selected ? tokens.accent : tokens.surface,
          color: selected ? tokens.accentText : tokens.textPrimary,
          borderColor: accentColor ?? tokens.border,
          // @ts-expect-error CSS custom property for focus ring color
          "--tw-ring-color": tokens.focusRing,
        }}
        {...rest}
      >
        {imageUrl ? (
          // Ленивая загрузка вне видимой области — соответствует бюджету производительности (раздел 15 ТЗ).
          // eslint-disable-next-line @next/next/no-img-element -- packages/ui не зависит от next/image
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="h-12 w-12 object-contain sm:h-16 sm:w-16"
          />
        ) : null}
        <span className="text-center text-sm font-semibold sm:text-base">{title}</span>
      </button>
    );
  },
);

CardButton.displayName = "CardButton";

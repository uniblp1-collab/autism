"use client";

import { ButtonHTMLAttributes, forwardRef, PointerEvent as ReactPointerEvent, SyntheticEvent, useRef, useState } from "react";
import clsx from "clsx";
import {
  MAX_CUSTOM_CARD_PX,
  MIN_CUSTOM_CARD_PX,
  MIN_TOUCH_TARGET_PX,
  paddingTokens,
  radiusTokens,
  resolveCategoryColorToken,
} from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";
import { Icon } from "./Icon";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

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
  size?: "small" | "medium" | "large";
  /** Точечный кастомный размер карточки в px (TASK_PATCH_3 §1) — null/undefined = размер по
   * умолчанию из `size`. Задан — карточка не растягивается на всю колонку сетки, а занимает
   * ровно этот фиксированный размер. */
  width?: number | null;
  height?: number | null;
  /** Показывает маркер изменения размера в углу карточки — только когда передан колбэк
   * (то есть только в режиме редактирования, см. вызывающий код). Вызывается один раз на
   * pointerup с финальным размером — не на каждое перемещение (не долбить API жестом). */
  onResize?: (width: number, height: number) => void;
  /** Показывает кнопку-крестик поверх карточки — только в режиме редактирования (ТЗ, часть A.7). */
  onDelete?: () => void;
  /** В избранном у текущего ребёнка — определяет заливку звёздочки. */
  favorite?: boolean;
  /** Показывает кнопку-звёздочку добавления/удаления из избранного — только когда передан
   * колбэк (режим редактирования либо раздел «Избранное», см. вызывающий код, TASK_PATCH_3 §2/3). */
  onToggleFavorite?: () => void;
}

/**
 * Единственный способ отрисовать кликабельную карточку в зоне ребёнка (DESIGN.md §6.3).
 * Плоский дизайн: заливка category-100, подпись/иконка — category-800, без теней и градиентов.
 */
export const CardButton = forwardRef<HTMLButtonElement, CardButtonProps>(
  (
    {
      title,
      imageUrl,
      accentColor,
      icon,
      selected,
      size = "small",
      width,
      height,
      onResize,
      onDelete,
      favorite,
      onToggleFavorite,
      className,
      ...rest
    },
    ref,
  ) => {
    const { tokens } = useTheme();
    // "small" — минимально допустимый тач-таргет (DESIGN.md §6.3), не уменьшаем ниже него.
    const dimension =
      size === "large" ? MIN_TOUCH_TARGET_PX * 1.4 : size === "medium" ? MIN_TOUCH_TARGET_PX * 1.2 : MIN_TOUCH_TARGET_PX;
    const { bg, fg } = resolveCategoryColorToken(accentColor);

    // Кастомный размер (TASK_PATCH_3 §1) — dragSize эфемерный визуальный стейт во время
    // перетаскивания; sizeRef хранит то же значение без задержки ре-рендера, чтобы pointerup
    // читал точно последнее значение, а не устаревшее из замыкания.
    const baseWidth = width ?? dimension;
    const baseHeight = height ?? dimension;
    const [dragSize, setDragSize] = useState<{ width: number; height: number } | null>(null);
    const sizeRef = useRef({ width: baseWidth, height: baseHeight });
    const dragStartRef = useRef<{ pointerX: number; pointerY: number; width: number; height: number } | null>(null);

    const effectiveWidth = dragSize?.width ?? baseWidth;
    const effectiveHeight = dragSize?.height ?? baseHeight;

    function handleResizePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStartRef.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        width: effectiveWidth,
        height: effectiveHeight,
      };
    }

    function handleResizePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
      const start = dragStartRef.current;
      if (!start) return;
      const nextWidth = clamp(start.width + (event.clientX - start.pointerX), MIN_CUSTOM_CARD_PX, MAX_CUSTOM_CARD_PX);
      const nextHeight = clamp(start.height + (event.clientY - start.pointerY), MIN_CUSTOM_CARD_PX, MAX_CUSTOM_CARD_PX);
      sizeRef.current = { width: nextWidth, height: nextHeight };
      setDragSize(sizeRef.current);
    }

    // Отправляем финальный размер один раз, по pointerup — не на каждое перемещение
    // (не долбить API десятками запросов во время одного жеста, см. TASK_PATCH_3 §1).
    function handleResizePointerUp() {
      if (!dragStartRef.current) return;
      dragStartRef.current = null;
      onResize?.(Math.round(sizeRef.current.width), Math.round(sizeRef.current.height));
    }
    // Если картинка недоступна (например, хранилище временно не отвечает), откатываемся на
    // иконку вместо "битой" картинки браузера — для ребёнка это выглядело бы как ошибка.
    const [imageFailed, setImageFailed] = useState(false);
    // null = ещё не измерено (или измерить не удалось, напр. без CORS с картинки другого
    // источника) — по умолчанию считаем картинку тёмной: белый текст на тёмном скриме читается
    // лучше как безопасный вариант, чем чёрный текст без скрима на непредсказуемо тёмном фото.
    const [isLightImage, setIsLightImage] = useState<boolean | null>(null);
    const hasImage = Boolean(imageUrl) && !imageFailed;

    // Определяем светлая/тёмная картинка по среднему значению яркости небольшой выборки
    // пикселей — нужно, чтобы подпись поверх фото (белая или тёмная) не терялась на фоне
    // (ТЗ: учитывать инверсию цвета текста для тёмных/светлых картинок).
    function handleImageLoad(event: SyntheticEvent<HTMLImageElement>) {
      const img = event.currentTarget;
      try {
        const sampleSize = 12;
        const canvas = document.createElement("canvas");
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
        let total = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          count += 1;
        }
        setIsLightImage(total / count > 150);
      } catch {
        // Картинка с другого источника без CORS-заголовков "заражает" canvas — читать пиксели
        // нельзя (SecurityError). Оставляем isLightImage=null (безопасный тёмный вариант).
      }
    }

    const overlayTextColor = isLightImage ? "#1A1A1A" : "#FFFFFF";
    const scrimRgb = isLightImage ? "255,255,255" : "0,0,0";

    const button = (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={clsx(
          hasImage ? "relative overflow-hidden" : "flex flex-col items-center justify-center gap-2",
          "transition-transform duration-150 ease-out active:scale-95",
          "focus:outline-none focus-visible:ring-4",
          className,
        )}
        style={{
          // Всегда фиксированный px-размер (dimension от `size`, либо кастомный
          // width/height, TASK_PATCH_3 §1) — карточка никогда не растягивается на всю
          // колонку контейнера. Это специально: контейнер-грид ("Размер карточек: Мелкие/
          // Средние/Крупные") — flex-wrap с карточками фиксированного размера, а не CSS Grid
          // с columns-под-размер-по-умолчанию — иначе кастомно увеличенная карточка вылезала
          // бы за пределы своей колонки и накладывалась на соседние (см. отчёт по багу).
          width: effectiveWidth,
          height: effectiveHeight,
          minWidth: effectiveWidth,
          minHeight: effectiveHeight,
          backgroundColor: bg,
          color: fg,
          borderRadius: radiusTokens.md,
          padding: hasImage ? 0 : paddingTokens.tile,
          border: selected ? `2px solid ${fg}` : "none",
          // @ts-expect-error CSS custom property for focus ring color
          "--tw-ring-color": tokens.focusRing,
        }}
        {...rest}
      >
        {hasImage ? (
          <>
            {/* Картинка растянута на всю карточку (object-fit: cover) — ленивая загрузка вне
                видимой области, бюджет производительности (ARCHITECTURE.md §7). */}
            {/* eslint-disable-next-line @next/next/no-img-element -- packages/ui не зависит от next/image */}
            <img
              src={imageUrl ?? undefined}
              alt=""
              loading="lazy"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              onError={() => setImageFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Скрим-градиент внизу карточки — гарантирует контраст подписи независимо от того,
                насколько точно определилась яркость картинки. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: `linear-gradient(to top, rgba(${scrimRgb}, 0.78) 0%, rgba(${scrimRgb}, 0) 60%)` }}
            />
            <span
              className="absolute inset-x-0 bottom-0 text-center"
              style={{ fontSize: 21, fontWeight: 500, color: overlayTextColor, padding: paddingTokens.tile }}
            >
              {title}
            </span>
          </>
        ) : (
          <>
            {icon ? <Icon name={icon} size={32} /> : null}
            <span className="text-center" style={{ fontSize: 21, fontWeight: 500 }}>
              {title}
            </span>
          </>
        )}
      </button>
    );

    if (!onDelete && !onToggleFavorite && !onResize) return button;

    // Крестик/звёздочка/маркер размера — отдельные кнопки поверх карточки, а не вложенные внутрь
    // нее (вложенные <button> недопустимы), поэтому оборачиваем в relative-контейнер только
    // когда хотя бы одна из них нужна — обычный рендер разметку иначе не меняет. Wrapper не
    // растягивается (inline-flex, без w-full) — сама кнопка уже фиксированного px-размера,
    // растягивать нечего.
    return (
      <div className="relative inline-flex">
        {button}
        {onToggleFavorite ? (
          <button
            type="button"
            aria-label={favorite ? `Убрать карточку «${title}» из избранного` : `Добавить карточку «${title}» в избранное`}
            aria-pressed={favorite}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite();
            }}
            className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-4"
            style={{
              backgroundColor: favorite ? tokens.favoriteFill : tokens.surfaceMuted,
              color: favorite ? tokens.favoriteText : tokens.textMuted,
              // @ts-expect-error CSS custom property for focus ring color
              "--tw-ring-color": tokens.focusRing,
            }}
          >
            <Icon name="star" size={16} strokeWidth={2.5} />
          </button>
        ) : null}
        {onDelete ? (
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
        ) : null}
        {onResize ? (
          <button
            type="button"
            aria-label={`Изменить размер карточки «${title}»`}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onClick={(event) => event.stopPropagation()}
            className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-4"
            style={{
              touchAction: "none",
              cursor: "nwse-resize",
              backgroundColor: tokens.surfaceMuted,
              color: tokens.textSecondary,
              // @ts-expect-error CSS custom property for focus ring color
              "--tw-ring-color": tokens.focusRing,
            }}
          >
            <Icon name="arrows-diagonal" size={16} strokeWidth={2.5} />
          </button>
        ) : null}
      </div>
    );
  },
);

CardButton.displayName = "CardButton";

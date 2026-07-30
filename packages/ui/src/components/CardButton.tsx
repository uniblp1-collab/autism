"use client";

import { ButtonHTMLAttributes, forwardRef, SyntheticEvent, useState } from "react";
import clsx from "clsx";
import { paddingTokens, radiusTokens, resolveCategoryColorToken } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";
import { Icon } from "./Icon";

export interface CardButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  /** Подпись карточки (sentence case, напр. «Позавтракать») — DESIGN.md §1. */
  title: string;
  /** URL изображения карточки; данные из БД, не хардкод. */
  imageUrl?: string | null;
  /** Цвет категории карточки из БД — 800-й тон; фон вычисляется по формуле DESIGN.md §3.4. */
  accentColor: string;
  /** Ключ иконки из реестра Tabler Icons — резервный визуал, пока нет imageUrl. */
  icon?: string;
  selected?: boolean;
  /** Показывает кнопку-крестик поверх карточки — только в режиме редактирования (ТЗ, часть A.7). */
  onDelete?: () => void;
  /** В избранном у текущего ребёнка — определяет заливку звёздочки. */
  favorite?: boolean;
  /** Показывает кнопку-звёздочку добавления/удаления из избранного — только когда передан
   * колбэк (режим редактирования либо раздел «Избранное», TASK_PATCH_3 §2/3). */
  onToggleFavorite?: () => void;
  /** Показывает кнопку «поставить карточку на первое место в разделе» (нижний левый угол) —
   * только в режиме редактирования (запрос заказчика: популярную карточку — в начало раздела). */
  onPromote?: () => void;
}

/**
 * Единственный способ отрисовать кликабельную карточку в зоне ребёнка (DESIGN.md §6.3).
 * Плоский дизайн: заливка category-100, подпись/иконка — category-800, без теней и градиентов.
 *
 * Размер карточки задаёт адаптивная сетка (TASK_GRID_AND_TTS.md §A): карточка занимает всю
 * ширину своей ячейки (`w-full`) и квадратная (`aspect-ratio: 1`) — число колонок/строк и, как
 * следствие, размер плиток определяется настройкой «карточек на экране» (Child.cardsPerPage),
 * а не фиксированным px-размером или перетаскиванием (попиксельный resize из TASK_PATCH_3 убран).
 */
export const CardButton = forwardRef<HTMLButtonElement, CardButtonProps>(
  (
    { title, imageUrl, accentColor, icon, selected, onDelete, favorite, onToggleFavorite, onPromote, className, ...rest },
    ref,
  ) => {
    const { tokens } = useTheme();
    const { bg, fg } = resolveCategoryColorToken(accentColor);

    // Если картинка недоступна — откатываемся на иконку вместо "битой" картинки браузера.
    const [imageFailed, setImageFailed] = useState(false);
    // Пока картинка не отрисовалась — под ней виден нейтральный пульсирующий фон вместо пустоты
    // (TASK_DEMO_ENHANCEMENTS.md §1); плавный fade, без резких/мигающих переходов (CLAUDE.md §5.3).
    const [imageLoaded, setImageLoaded] = useState(false);
    // null = ещё не измерено — по умолчанию считаем картинку тёмной (белый текст на скриме).
    const [isLightImage, setIsLightImage] = useState<boolean | null>(null);
    const hasImage = Boolean(imageUrl) && !imageFailed;

    // Светлая/тёмная картинка по средней яркости выборки пикселей — чтобы подпись поверх фото
    // (белая/тёмная) не терялась на фоне.
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
        // Картинка с другого источника без CORS "заражает" canvas — читать пиксели нельзя.
      }
      setImageLoaded(true);
    }

    const overlayTextColor = isLightImage ? "#1A1A1A" : "#FFFFFF";
    const scrimRgb = isLightImage ? "255,255,255" : "0,0,0";

    const button = (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={clsx(
          "w-full",
          hasImage ? "relative overflow-hidden" : "flex flex-col items-center justify-center gap-2",
          "transition-transform duration-150 ease-out active:scale-95",
          "focus:outline-none focus-visible:ring-4",
          className,
        )}
        style={{
          // Карточка заполняет ячейку адаптивной сетки и квадратная — размер приходит от сетки
          // (число колонок под Child.cardsPerPage), а не фиксированный px (см. JSDoc компонента).
          aspectRatio: "1",
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
            {!imageLoaded ? (
              // Нейтральный плейсхолдер вместо пустоты, пока картинка грузится/декодируется —
              // мягкая пульсация (Tailwind animate-pulse — плавное изменение непрозрачности,
              // не мигание), сменяется картинкой через fade, без скачка layout.
              <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: tokens.surfaceMuted }} />
            ) : null}
            {/* Картинка на всю карточку (object-fit: cover), ленивая загрузка (ARCHITECTURE.md §7). */}
            {/* eslint-disable-next-line @next/next/no-img-element -- packages/ui не зависит от next/image */}
            <img
              src={imageUrl ?? undefined}
              alt=""
              loading="lazy"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              onError={() => setImageFailed(true)}
              className={clsx(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out",
                imageLoaded ? "opacity-100" : "opacity-0",
              )}
            />
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

    if (!onDelete && !onToggleFavorite && !onPromote) return button;

    // Крестик/звёздочка — отдельные кнопки поверх карточки (вложенные <button> недопустимы),
    // поэтому оборачиваем в relative-контейнер во всю ширину ячейки только когда что-то из них нужно.
    return (
      <div className="relative w-full">
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
        {onPromote ? (
          <button
            type="button"
            aria-label={`Поставить карточку «${title}» на первое место в разделе`}
            onClick={(event) => {
              event.stopPropagation();
              onPromote();
            }}
            className="absolute -bottom-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-4"
            style={{
              backgroundColor: tokens.surfaceMuted,
              color: tokens.textSecondary,
              // @ts-expect-error CSS custom property for focus ring color
              "--tw-ring-color": tokens.focusRing,
            }}
          >
            <Icon name="arrow-bar-to-left" size={16} strokeWidth={2.5} />
          </button>
        ) : null}
      </div>
    );
  },
);

CardButton.displayName = "CardButton";

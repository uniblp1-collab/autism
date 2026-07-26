"use client";

import { ChangeEvent, Children, FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  AddCardTile,
  Button,
  CardButton,
  CATEGORY_COLOR_PRESETS,
  CATEGORY_ICON_PRESETS,
  CategoryPill,
  FAVORITES_PILL_COLOR,
  Icon,
  Input,
  Modal,
  SCHEDULE_PILL_COLOR,
  ScheduleTile,
  YesNoStickyPanel,
  useTheme,
} from "@autism-connect/ui";
import { Card, CardType, Category } from "@autism-connect/shared";
import {
  useCategories,
  useCards,
  useCreateCard,
  useDeleteCard,
  usePromoteCard,
  useUpdateCard,
  useUpdateCategory,
  useUploadCardImage,
} from "../../../features/cards/useCards";
import { useFavorites, useToggleFavorite } from "../../../features/cards/useFavorites";
import { useChild, useUpdateChild } from "../../../features/children/useChildren";
import { useSentenceBuilder } from "../../../features/sentence-builder/useSentenceBuilder";
import { useCompleteScheduleItem, useSchedules } from "../../../features/schedule/useSchedules";
import { isDemoMode } from "../../../shared/api/demoData";
import { DemoVoiceCheck } from "../../../shared/ui/DemoVoiceCheck";

// Избранные карточки показываются первыми в сетке категории (исходное ТЗ §6.7) —
// стабильная сортировка, чтобы порядок внутри "избранных"/"остальных" не менялся сам по себе.
function sortFavoritesFirst(cards: Card[], favoriteCardIds: Set<string>): Card[] {
  return [...cards].sort((a, b) => Number(favoriteCardIds.has(b.id)) - Number(favoriteCardIds.has(a.id)));
}

const FAVORITES_TAB = "__favorites__";
const SCHEDULE_TAB = "__schedule__";

// Режим редактирования (ТЗ §A.7) пока не защищён PIN-кодом — см. .env.example.
// В офлайн-демо редактирование полностью убрано — только показ (TASK_DEMO_OFFLINE.md §4).
const EDIT_MODE_ENABLED = !isDemoMode && process.env.NEXT_PUBLIC_EDIT_MODE_ENABLED !== "false";

// Границы числа карточек на экране (TASK_GRID_AND_TTS.md §A.2).
const MIN_CARDS_PER_PAGE = 2;
const MAX_CARDS_PER_PAGE = 10;

interface QuickAddCardModalProps {
  open: boolean;
  onClose: () => void;
  category: Category;
  childId: string;
}

function QuickAddCardModal({ open, onClose, category, childId }: QuickAddCardModalProps) {
  const createCard = useCreateCard();
  const [title, setTitle] = useState("");
  const [ttsPhrase, setTtsPhrase] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !ttsPhrase.trim()) return;
    await createCard.mutateAsync({
      categoryId: category.id,
      childId,
      title: title.trim(),
      // Полная фраза озвучивания задаётся на карточке целиком (редакция 4).
      ttsPhrase: ttsPhrase.trim(),
    });
    setTitle("");
    setTtsPhrase("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Добавить карточку в «${category.title}»`}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input label="Подпись на карточке (напр. «Двор»)" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input
          label="Что произносить (напр. «Идём во двор»)"
          required
          value={ttsPhrase}
          onChange={(e) => setTtsPhrase(e.target.value)}
        />
        <Button type="submit" disabled={createCard.isPending}>
          {createCard.isPending ? "Сохраняем..." : "Добавить"}
        </Button>
      </form>
    </Modal>
  );
}

interface EditCardModalProps {
  card: Card;
  onClose: () => void;
}

// Доступно на любой карточке (включая библиотечные, не только кастомные) в режиме
// редактирования — тап по карточке при активном карандаше открывает эту модалку
// вместо выбора карточки для фразы. Загрузка картинки — тоже отсюда (раньше была
// доступна только из админ-панели), поэтому родителю не нужен доступ в /admin, чтобы
// добавить фото к карточке своего ребёнка.
function EditCardModal({ card, onClose }: EditCardModalProps) {
  const { tokens } = useTheme();
  const updateCard = useUpdateCard();
  const uploadImage = useUploadCardImage();
  const [title, setTitle] = useState(card.title);
  const [ttsPhrase, setTtsPhrase] = useState(card.ttsPhrase || card.ttsText);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !ttsPhrase.trim()) return;
    await updateCard.mutateAsync({
      cardId: card.id,
      input: { title: title.trim(), ttsPhrase: ttsPhrase.trim() },
    });
    onClose();
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImageError(null);
    try {
      await uploadImage.mutateAsync({ cardId: card.id, file });
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Не удалось загрузить картинку");
    }
  }

  return (
    <Modal open onClose={onClose} title={`Редактировать «${card.title}»`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden"
            style={{ borderRadius: 14, backgroundColor: card.color, backgroundImage: card.imageUrl ? `url(${card.imageUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
          >
            {!card.imageUrl ? <span style={{ fontSize: 11, color: tokens.surface, textAlign: "center" }}>нет фото</span> : null}
          </div>
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 14, fontWeight: 500, color: "inherit", cursor: "pointer" }}>
              <span className="underline">{uploadImage.isPending ? "Загрузка..." : card.imageUrl ? "Заменить фото" : "Добавить фото"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploadImage.isPending}
                onChange={handleImageChange}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowInstructions((prev) => !prev)}
              className="text-left underline"
              style={{ fontSize: 12, color: "inherit", opacity: 0.7 }}
            >
              {showInstructions ? "Скрыть инструкцию" : "Как это работает?"}
            </button>
          </div>
        </div>

        {imageError ? <p style={{ fontSize: 13, color: tokens.danger }}>{imageError}</p> : null}

        {showInstructions ? (
          <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.85 }}>
            <p>1. Нажмите «Добавить фото»/«Заменить фото» и выберите файл на своём устройстве.</p>
            <p>2. Допустимые форматы — JPEG, PNG или WebP, размер файла до 5 МБ.</p>
            <p>
              3. Картинка загружается в файловое хранилище приложения (S3-совместимое, MinIO) и после
              загрузки сразу растягивается на всю карточку — название будет отображаться поверх неё.
            </p>
            <p>4. Изменение фото видно сразу всем экранам, где используется эта карточка.</p>
          </div>
        ) : null}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input label="Подпись на карточке" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            label="Что произносить (напр. «Идём во двор»)"
            required
            value={ttsPhrase}
            onChange={(e) => setTtsPhrase(e.target.value)}
          />
          <Button type="submit" disabled={updateCard.isPending}>
            {updateCard.isPending ? "Сохраняем..." : "Сохранить"}
          </Button>
        </form>
      </div>
    </Modal>
  );
}

interface EditCategoryModalProps {
  category: Category;
  onClose: () => void;
}

// Редактирование раздела из режима редактирования (TASK_GRID_AND_TTS.md §B.5 — переименование
// заказчик просил сохранить; иконка/цвет кнопки — по новому запросу, самостоятельная замена
// без участия разработчика). Озвучивание больше НЕ живёт на уровне раздела: фраза задаётся на
// каждой карточке (Card.ttsPhrase), поэтому изменения здесь не влияют на то, что произносят
// карточки раздела. Иконка выбирается из готового набора Tabler-иконок (CATEGORY_ICON_PRESETS),
// цвет — из набора предустановленных тонов DESIGN.md §3.4 (CATEGORY_COLOR_PRESETS), а не
// произвольный ввод — так гарантирован контраст фон/текст пилюли и карточек этого раздела
// (CLAUDE.md §5.3: только токены темы, не хардкод цвета в компонентах).
function EditCategoryModal({ category, onClose }: EditCategoryModalProps) {
  const { tokens } = useTheme();
  const updateCategory = useUpdateCategory();
  const [title, setTitle] = useState(category.title);
  const [icon, setIcon] = useState(category.icon);
  const [color, setColor] = useState(category.color);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await updateCategory.mutateAsync({
      categoryId: category.id,
      input: { title: title.trim(), icon, color },
    });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={`Раздел «${category.title}»`}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input label="Название раздела" required value={title} onChange={(e) => setTitle(e.target.value)} />

        <div className="flex flex-col gap-2">
          <span style={{ fontSize: 14, fontWeight: 500, color: tokens.textPrimary }}>Кнопка раздела</span>
          <CategoryPill label={title.trim() || category.title} icon={icon} color={color} active />
        </div>

        <div className="flex flex-col gap-2">
          <span style={{ fontSize: 14, color: tokens.textSecondary }}>Иконка</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ICON_PRESETS.map((iconKey) => (
              <button
                key={iconKey}
                type="button"
                aria-label={`Иконка «${iconKey}»`}
                aria-pressed={icon === iconKey}
                onClick={() => setIcon(iconKey)}
                className="flex h-11 w-11 items-center justify-center focus:outline-none focus-visible:ring-4"
                style={{
                  borderRadius: 999,
                  backgroundColor: icon === iconKey ? tokens.accentSoft : tokens.surfaceMuted,
                  color: icon === iconKey ? tokens.accentText : tokens.textSecondary,
                  border: icon === iconKey ? `2px solid ${tokens.accentText}` : "none",
                  // @ts-expect-error CSS custom property for focus ring color
                  "--tw-ring-color": tokens.focusRing,
                }}
              >
                <Icon name={iconKey} size={20} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span style={{ fontSize: 14, color: tokens.textSecondary }}>Цвет</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                aria-label={`Цвет «${preset.label}»`}
                aria-pressed={color.toUpperCase() === preset.hex}
                onClick={() => setColor(preset.hex)}
                className="flex h-9 w-9 items-center justify-center focus:outline-none focus-visible:ring-4"
                style={{
                  borderRadius: 999,
                  backgroundColor: preset.hex,
                  // Иконка check рендерится в currentColor (см. packages/ui/Icon.tsx) — белый
                  // текстовый цвет кнопки делает галочку видимой на любом из пресетов.
                  color: "#FFFFFF",
                  border:
                    color.toUpperCase() === preset.hex ? `3px solid ${tokens.textPrimary}` : `1px solid ${tokens.border}`,
                  // @ts-expect-error CSS custom property for focus ring color
                  "--tw-ring-color": tokens.focusRing,
                }}
              >
                {color.toUpperCase() === preset.hex ? <Icon name="check" size={16} /> : null}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 13, color: tokens.textSecondary }}>
          Фраза озвучивания задаётся на каждой карточке отдельно (её поле «Что произносить») —
          название, иконка и цвет раздела на неё не влияют.
        </p>
        <Button type="submit" disabled={updateCategory.isPending}>
          {updateCategory.isPending ? "Сохраняем..." : "Сохранить"}
        </Button>
      </form>
    </Modal>
  );
}

// Адаптивная сетка карточек с клиентской пагинацией (TASK_GRID_AND_TTS.md §A). На один экран
// помещается ровно `cardsPerPage` квадратных плиток; раскладка колонки×строки подбирается под
// размер и ориентацию экрана так, чтобы плитки были как можно крупнее и заполняли ширину без
// пустой колонки справа (прежний баг). Лишние карточки уходят на следующую страницу, переход —
// круглой стрелкой в углу (вниз/вверх). Пагинация чисто клиентская: все карточки уже загружены.
function computeGridLayout(width: number, height: number, cardsPerPage: number, gap: number) {
  // Перебираем число колонок и выбираем то, при котором квадратная плитка максимальна и при этом
  // все `cardsPerPage` штук помещаются и по ширине, и по высоте — классическая "N квадратов в WxH".
  let best = { columns: 1, tileSize: 0 };
  for (let columns = 1; columns <= cardsPerPage; columns++) {
    const rows = Math.ceil(cardsPerPage / columns);
    const tileByWidth = (width - (columns - 1) * gap) / columns;
    const tileByHeight = (height - (rows - 1) * gap) / rows;
    const tileSize = Math.min(tileByWidth, tileByHeight);
    if (tileSize > best.tileSize) best = { columns, tileSize };
  }
  return best;
}

function PagedCardGrid({ children, cardsPerPage }: { children: ReactNode; cardsPerPage: number }) {
  const { tokens } = useTheme();
  const outerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ columns: number; tileSize: number }>({ columns: 2, tileSize: 0 });
  const [pageIndex, setPageIndex] = useState(0);

  const GAP_PX = 12;
  const items = Children.toArray(children);
  const pageCount = Math.max(1, Math.ceil(items.length / cardsPerPage));

  useEffect(() => {
    setPageIndex((prev) => Math.min(prev, pageCount - 1));
  }, [pageCount]);

  const start = pageIndex * cardsPerPage;
  const pageItems = items.slice(start, start + cardsPerPage);
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    function recompute() {
      const node = outerRef.current;
      if (!node) return;
      const width = node.clientWidth;
      const height = node.clientHeight;
      if (width <= 0 || height <= 0) return;
      // Считаем раскладку под РЕАЛЬНОЕ число карточек на этой странице (pageItems.length), а не
      // под константу cardsPerPage — иначе для разделов с карточками меньше cardsPerPage
      // (например, «Гигиена» из 3 карточек при cardsPerPage=6) или для последней неполной
      // страницы алгоритм пытался бы уместить несуществующие "лишние" слоты, что давало
      // некорректный (обычно завышенный или странно расположенный) размер плитки.
      const slotCount = Math.max(1, Math.min(cardsPerPage, pageItems.length));
      const next = computeGridLayout(width, height, slotCount, GAP_PX);
      setLayout((prev) => (prev.columns === next.columns && prev.tileSize === next.tileSize ? prev : next));
    }
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
    // pageItems.length меняется при переходе между страницами (последняя может быть неполной)
    // и при изменении числа карточек в разделе — оба случая должны пересчитать раскладку.
  }, [cardsPerPage, pageItems.length]);

  const arrowButtonStyle = {
    backgroundColor: tokens.surface,
    color: tokens.textPrimary,
    border: `1px solid ${tokens.border}`,
    "--tw-ring-color": tokens.focusRing,
  };

  return (
    <div ref={outerRef} className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="grid content-start justify-center"
        style={{
          gridTemplateColumns: `repeat(${layout.columns}, ${layout.tileSize}px)`,
          gap: GAP_PX,
        }}
      >
        {pageItems}
      </div>
      {canPrev ? (
        <button
          type="button"
          aria-label="Показать предыдущий экран карточек"
          onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full shadow focus:outline-none focus-visible:ring-4"
          style={arrowButtonStyle}
        >
          <Icon name="chevron-up" size={22} />
        </button>
      ) : null}
      {canNext ? (
        <button
          type="button"
          aria-label="Показать следующий экран карточек"
          onClick={() => setPageIndex((prev) => Math.min(pageCount - 1, prev + 1))}
          className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full shadow focus:outline-none focus-visible:ring-4"
          style={arrowButtonStyle}
        >
          <Icon name="chevron-down" size={22} />
        </button>
      ) : null}
      {pageCount > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {Array.from({ length: pageCount }).map((_, i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: i === pageIndex ? tokens.textSecondary : tokens.border }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ChildScreenPage() {
  const params = useParams<{ childId: string }>();
  const childId = params.childId;
  const { tokens } = useTheme();

  const { data: child } = useChild(childId);
  const difficultyLevel = child?.difficultyLevel ?? 1;

  const { data: categories = [] } = useCategories();
  const unlockedCategories = child
    ? categories.filter((c) => c.isPrimary || child.unlockedCategoryIds.includes(c.id))
    : categories.filter((c) => c.isPrimary);

  const { data: favorites = [] } = useFavorites(childId);
  const [activeTab, setActiveTab] = useState<string>(FAVORITES_TAB);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Черновик числа карточек на экране — применяется к сетке сразу (предпросмотр), но
  // сохраняется на бэкенде только по нажатию «Сохранить».
  const savedCardsPerPage = child?.cardsPerPage ?? 6;
  const [draftCardsPerPage, setDraftCardsPerPage] = useState<number>(savedCardsPerPage);
  useEffect(() => {
    if (child?.cardsPerPage) setDraftCardsPerPage(child.cardsPerPage);
  }, [child?.cardsPerPage]);
  const updateChild = useUpdateChild(childId);
  const isCardsPerPageDirty = Boolean(child) && draftCardsPerPage !== savedCardsPerPage;

  const activeCategory = unlockedCategories.find((c) => c.id === activeTab) ?? null;

  const { data: yesNoCards = [] } = useCards({ isSystemCard: true });
  // Не полагаемся на порядок карточек в ответе API (он зависит от priority/сортировки
  // в БД, а не от смысла) — визуальный порядок и цвета Да/Нет задаёт YesNoStickyPanel
  // (TASK_PATCH_1.md §3), сюда просто нужно передать правильную карточку в правильный слот.
  const yesCard = yesNoCards.find((c) => c.title === "Да");
  const noCard = yesNoCards.find((c) => c.title === "Нет");
  const { data: favoriteCards = [] } = useCards({ childId, includeCustom: true, cardType: CardType.NOUN });

  const { data: adjectiveCards = [] } = useCards({ cardType: CardType.ADJECTIVE });
  const { data: nounCards = [] } = useCards({
    categoryId: activeCategory?.id,
    childId,
    includeCustom: true,
    cardType: CardType.NOUN,
  });

  const sb = useSentenceBuilder({
    childId,
    difficultyLevel,
    categories: unlockedCategories,
    adjectiveCards,
    nounCards,
  });

  // Пересинхронизируем состояние сборки фразы только при смене вкладки категории —
  // sb.selectCategory намеренно не входит в зависимости, чтобы не создавать цикл
  // (это стабильный колбэк из zustand-стора, ре-рендер по нему не нужен).
  const selectCategory = sb.selectCategory;
  useEffect(() => {
    if (activeCategory) selectCategory(activeCategory);
  }, [activeTab, activeCategory, selectCategory]);

  const favoriteCardIds = new Set(favorites.map((f) => f.cardId));
  const visibleFavoriteCards: Card[] = favoriteCards.filter((c) => favoriteCardIds.has(c.id));

  const { data: schedules = [] } = useSchedules(childId);
  const completeItem = useCompleteScheduleItem(childId);
  const deleteCard = useDeleteCard();
  const promoteCard = usePromoteCard();
  const toggleFavorite = useToggleFavorite(childId);

  function handleToggleFavorite(cardId: string) {
    if (favoriteCardIds.has(cardId)) {
      toggleFavorite.remove.mutate(cardId);
    } else {
      toggleFavorite.add.mutate(cardId);
    }
  }

  const showYesNo = activeTab !== SCHEDULE_TAB;

  return (
    // h-screen (не min-h-screen) — фиксирует высоту корневого контейнера ровно на экран,
    // иначе <main>'s flex-1/h-full цепочка не имеет определённой высоты, от которой можно
    // отталкиваться: контент внутри PagedCardGrid просто раздвигал бы всю страницу вниз за
    // пределы вьюпорта (документ скроллился бы целиком), а не оставался в границах видимой
    // области с собственными стрелочками пролистывания.
    <div className="flex h-screen flex-col" style={{ backgroundColor: tokens.background }}>
      {/* Офлайн-демо: предупреждение, если на устройстве нет русского голоса (TASK_DEMO_OFFLINE.md §7). */}
      {isDemoMode ? <DemoVoiceCheck /> : null}
      <nav
        className="flex items-center gap-2 overflow-x-auto p-3"
        style={{ borderBottom: `1px solid ${tokens.border}` }}
      >
        {/* Расписание — первая пилюля слева (по запросу заказчика). Расписание/Избранное —
            только иконка, без подписи (по запросу заказчика); label остаётся — используется
            как aria-label кнопки (см. CategoryPill). */}
        <CategoryPill
          label="Расписание"
          icon="calendar"
          color={SCHEDULE_PILL_COLOR}
          showLabel={false}
          active={activeTab === SCHEDULE_TAB}
          onClick={() => setActiveTab(SCHEDULE_TAB)}
        />
        <CategoryPill
          label="Избранное"
          icon="star"
          color={FAVORITES_PILL_COLOR}
          showLabel={false}
          active={activeTab === FAVORITES_TAB}
          onClick={() => setActiveTab(FAVORITES_TAB)}
        />
        {unlockedCategories.map((category) => (
          <CategoryPill
            key={category.id}
            label={category.title}
            icon={category.icon}
            color={category.color}
            isPrimary={category.isPrimary}
            onClick={() => setActiveTab(category.id)}
            active={activeTab === category.id}
          />
        ))}

        {EDIT_MODE_ENABLED ? (
          <button
            type="button"
            aria-label={isEditMode ? "Выключить режим редактирования" : "Включить режим редактирования"}
            aria-pressed={isEditMode}
            onClick={() => setIsEditMode((prev) => !prev)}
            className="ml-auto flex shrink-0 items-center justify-center p-2 focus:outline-none focus-visible:ring-4"
            style={{
              borderRadius: 999,
              backgroundColor: isEditMode ? tokens.accentSoft : tokens.surfaceMuted,
              color: isEditMode ? tokens.accentText : tokens.textSecondary,
              // @ts-expect-error CSS custom property for focus ring color
              "--tw-ring-color": tokens.focusRing,
            }}
          >
            <Icon name="pencil" size={18} />
          </button>
        ) : null}
      </nav>

      {isEditMode ? (
        <div
          className="flex flex-wrap items-center gap-2 p-3"
          style={{ borderBottom: `1px solid ${tokens.border}` }}
        >
          {/* Число карточек на экране (2–10) — задаёт и размер плиток (адаптивная сетка), и
              порог пагинации (TASK_GRID_AND_TTS.md §A.2). */}
          <span style={{ fontSize: 14, color: tokens.textSecondary }}>Карточек на экране:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Меньше карточек на экране"
              disabled={draftCardsPerPage <= MIN_CARDS_PER_PAGE}
              onClick={() => setDraftCardsPerPage((n) => Math.max(MIN_CARDS_PER_PAGE, n - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-4 disabled:opacity-40"
              style={{
                backgroundColor: tokens.surfaceMuted,
                color: tokens.textSecondary,
                // @ts-expect-error CSS custom property for focus ring color
                "--tw-ring-color": tokens.focusRing,
              }}
            >
              <Icon name="minus" size={16} strokeWidth={2.5} />
            </button>
            <span style={{ fontSize: 16, fontWeight: 600, minWidth: 20, textAlign: "center", color: tokens.textPrimary }}>
              {draftCardsPerPage}
            </span>
            <button
              type="button"
              aria-label="Больше карточек на экране"
              disabled={draftCardsPerPage >= MAX_CARDS_PER_PAGE}
              onClick={() => setDraftCardsPerPage((n) => Math.min(MAX_CARDS_PER_PAGE, n + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-4 disabled:opacity-40"
              style={{
                backgroundColor: tokens.surfaceMuted,
                color: tokens.textSecondary,
                // @ts-expect-error CSS custom property for focus ring color
                "--tw-ring-color": tokens.focusRing,
              }}
            >
              <Icon name="plus" size={16} strokeWidth={2.5} />
            </button>
          </div>
          {/* Переименование активного раздела (TASK_GRID_AND_TTS.md §B.5). Только для настоящих
              разделов — не для «Избранного»/«Расписания» (activeCategory там null). */}
          {activeCategory ? (
            <button
              type="button"
              onClick={() => setEditingCategory(activeCategory)}
              className="flex items-center gap-1 px-3 py-1 focus:outline-none focus-visible:ring-4"
              style={{
                borderRadius: 999,
                fontSize: 14,
                backgroundColor: tokens.surfaceMuted,
                color: tokens.textSecondary,
                // @ts-expect-error CSS custom property for focus ring color
                "--tw-ring-color": tokens.focusRing,
              }}
            >
              <Icon name="pencil" size={14} />
              Раздел
            </button>
          ) : null}
          <Button
            type="button"
            className="ml-auto"
            disabled={!isCardsPerPageDirty || updateChild.isPending}
            onClick={() => updateChild.mutate({ cardsPerPage: draftCardsPerPage })}
          >
            {updateChild.isPending ? "Сохраняем..." : "Сохранить"}
          </Button>
        </div>
      ) : null}

      <main className="flex flex-1 flex-col overflow-hidden p-4 pb-40">
        {activeTab === SCHEDULE_TAB ? (
          <div className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto">
            {schedules.map((schedule) => (
              <section key={schedule.id}>
                <h2 className="mb-3" style={{ fontSize: 18, fontWeight: 500, color: tokens.textPrimary }}>
                  {schedule.title}
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {schedule.items.map((item, index) => {
                    const firstUpcomingIndex = schedule.items.findIndex((i) => !i.isCompleted);
                    const state = item.isCompleted ? "done" : index === firstUpcomingIndex ? "current" : "upcoming";
                    return (
                      <ScheduleTile
                        key={item.id}
                        title={item.title}
                        state={state}
                        onClick={() => completeItem.mutate({ itemId: item.id, isCompleted: !item.isCompleted })}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : activeTab === FAVORITES_TAB ? (
          <PagedCardGrid key={activeTab} cardsPerPage={draftCardsPerPage}>
            {visibleFavoriteCards.map((card) => (
              <CardButton
                key={card.id}
                title={card.title}
                imageUrl={card.imageUrl}
                accentColor={card.color}
                // В режиме редактирования тап открывает редактирование; иначе — озвучивает
                // готовую фразу карточки (редакция 4, независимо от уровня сложности).
                onClick={() => (isEditMode ? setEditingCard(card) : sb.speakCard(card))}
                // Раздел «Избранное» никогда не показывает крестик удаления карточки из
                // библиотеки — только «убрать из избранного» (TASK_PATCH_3 §3). Звезда доступна
                // только в режиме редактирования (TASK_PATCH_3 §2).
                favorite
                onToggleFavorite={isEditMode ? () => handleToggleFavorite(card.id) : undefined}
              />
            ))}
          </PagedCardGrid>
        ) : activeCategory ? (
          <PagedCardGrid key={activeTab} cardsPerPage={draftCardsPerPage}>
            {sortFavoritesFirst(nounCards, favoriteCardIds).map((card) => (
              <CardButton
                key={card.id}
                title={card.title}
                imageUrl={card.imageUrl}
                accentColor={card.color}
                // В режиме редактирования тап по карточке открывает редактирование, а не
                // озвучивает — включая библиотечные карточки (бэкенд защищает только Да/Нет).
                // Иначе — озвучивает готовую фразу карточки (Card.ttsPhrase, редакция 4).
                onClick={() => (isEditMode ? setEditingCard(card) : sb.speakCard(card))}
                onDelete={isEditMode ? () => deleteCard.mutate(card.id) : undefined}
                favorite={favoriteCardIds.has(card.id)}
                // Звезда видна только в режиме редактирования (TASK_PATCH_3 §2).
                onToggleFavorite={isEditMode ? () => handleToggleFavorite(card.id) : undefined}
                // "Поставить на первое место в разделе" — по запросу заказчика, только в режиме
                // редактирования (см. usePromoteCard/PromoteCardUseCase).
                onPromote={isEditMode ? () => promoteCard.mutate({ cardId: card.id, childId }) : undefined}
              />
            ))}
            {isEditMode ? <AddCardTile onClick={() => setIsAddModalOpen(true)} /> : null}
          </PagedCardGrid>
        ) : null}
      </main>

      <footer
        className="fixed inset-x-0 bottom-0 flex flex-col"
        style={{ borderTop: `1px solid ${tokens.border}`, backgroundColor: tokens.background }}
      >
        {showYesNo && yesCard && noCard ? (
          <YesNoStickyPanel
            yesCard={yesCard}
            noCard={noCard}
            onSelect={(systemCard) => {
              const card = yesNoCards.find((c) => c.id === systemCard.id);
              if (card) sb.speakSystemCard(card);
            }}
          />
        ) : null}
      </footer>

      {activeCategory && childId ? (
        <QuickAddCardModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          category={activeCategory}
          childId={childId}
        />
      ) : null}

      {editingCard ? <EditCardModal card={editingCard} onClose={() => setEditingCard(null)} /> : null}

      {editingCategory ? (
        <EditCategoryModal category={editingCategory} onClose={() => setEditingCategory(null)} />
      ) : null}
    </div>
  );
}

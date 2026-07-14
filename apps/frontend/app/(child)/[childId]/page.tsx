"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AddCardTile,
  Button,
  CardButton,
  CategoryPill,
  FAVORITES_PILL_COLOR,
  Icon,
  Input,
  MIN_TOUCH_TARGET_PX,
  Modal,
  SCHEDULE_PILL_COLOR,
  ScheduleTile,
  SentenceBuilderPanel,
  YesNoStickyPanel,
  useTheme,
} from "@autism-connect/ui";
import { Card, CardSize, CardType, Category } from "@autism-connect/shared";
import {
  useCategories,
  useCards,
  useCreateCard,
  useDeleteCard,
  useUpdateCard,
  useUploadCardImage,
} from "../../../features/cards/useCards";
import { useFavorites, useToggleFavorite } from "../../../features/cards/useFavorites";
import { useChild, useUpdateChild } from "../../../features/children/useChildren";
import { useSentenceBuilder } from "../../../features/sentence-builder/useSentenceBuilder";
import { useCompleteScheduleItem, useSchedules } from "../../../features/schedule/useSchedules";

// Избранные карточки показываются первыми в сетке категории (исходное ТЗ §6.7) —
// стабильная сортировка, чтобы порядок внутри "избранных"/"остальных" не менялся сам по себе.
function sortFavoritesFirst(cards: Card[], favoriteCardIds: Set<string>): Card[] {
  return [...cards].sort((a, b) => Number(favoriteCardIds.has(b.id)) - Number(favoriteCardIds.has(a.id)));
}

const FAVORITES_TAB = "__favorites__";
const SCHEDULE_TAB = "__schedule__";

// Режим редактирования (ТЗ §A.7) пока не защищён PIN-кодом — см. .env.example.
const EDIT_MODE_ENABLED = process.env.NEXT_PUBLIC_EDIT_MODE_ENABLED !== "false";

const CARD_SIZE_OPTIONS: { value: CardSize; label: string }[] = [
  { value: CardSize.SMALL, label: "Мелкие" },
  { value: CardSize.MEDIUM, label: "Средние" },
  { value: CardSize.LARGE, label: "Крупные" },
];

const CARD_SIZE_TO_BUTTON_SIZE: Record<CardSize, "small" | "medium" | "large"> = {
  [CardSize.SMALL]: "small",
  [CardSize.MEDIUM]: "medium",
  [CardSize.LARGE]: "large",
};

// Совпадает с расчётом dimension внутри CardButton — используется, чтобы ширина колонок
// сетки подстраивалась под выбранный размер карточек (крупные карточки => меньше и шире
// колонок, сетка заполняет экран), а не оставалась на фиксированных 3/5 колонках.
const CARD_SIZE_TO_MIN_PX: Record<CardSize, number> = {
  [CardSize.SMALL]: MIN_TOUCH_TARGET_PX,
  [CardSize.MEDIUM]: MIN_TOUCH_TARGET_PX * 1.2,
  [CardSize.LARGE]: MIN_TOUCH_TARGET_PX * 1.4,
};

interface QuickAddCardModalProps {
  open: boolean;
  onClose: () => void;
  category: Category;
  childId: string;
}

function QuickAddCardModal({ open, onClose, category, childId }: QuickAddCardModalProps) {
  const createCard = useCreateCard();
  const [title, setTitle] = useState("");
  const [phraseForm, setPhraseForm] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !phraseForm.trim()) return;
    await createCard.mutateAsync({
      categoryId: category.id,
      childId,
      title: title.trim(),
      phraseForm: phraseForm.trim(),
      ttsText: title.trim(),
    });
    setTitle("");
    setPhraseForm("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Добавить карточку в «${category.title}»`}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input label="Название" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input
          label="Словоформа во фразе (напр. «кашу» для «Ем кашу»)"
          required
          value={phraseForm}
          onChange={(e) => setPhraseForm(e.target.value)}
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
  const [phraseForm, setPhraseForm] = useState(card.phraseForm);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !phraseForm.trim()) return;
    await updateCard.mutateAsync({
      cardId: card.id,
      input: { title: title.trim(), phraseForm: phraseForm.trim(), ttsText: title.trim() },
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
          <Input label="Название" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            label="Словоформа во фразе (напр. «кашу» для «Ем кашу»)"
            required
            value={phraseForm}
            onChange={(e) => setPhraseForm(e.target.value)}
          />
          <Button type="submit" disabled={updateCard.isPending}>
            {updateCard.isPending ? "Сохраняем..." : "Сохранить"}
          </Button>
        </form>
      </div>
    </Modal>
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

  // Черновик размера сетки — применяется к карточкам сразу (предпросмотр), но
  // сохраняется на бэкенде только по нажатию «Сохранить».
  const [draftCardSize, setDraftCardSize] = useState<CardSize>(child?.cardSize ?? CardSize.SMALL);
  useEffect(() => {
    if (child?.cardSize) setDraftCardSize(child.cardSize);
  }, [child?.cardSize]);
  const updateChild = useUpdateChild(childId);
  const isCardSizeDirty = Boolean(child) && draftCardSize !== child?.cardSize;
  const cardButtonSize = CARD_SIZE_TO_BUTTON_SIZE[draftCardSize];
  // Число колонок подстраивается под выбранный размер карточек (auto-fill), а не остаётся
  // фиксированным — иначе крупные карточки продолжали бы делить экран на то же число долек
  // и не занимали бы дополнительное освободившееся место.
  // auto-fit (не auto-fill) схлопывает пустые дорожки сетки — иначе при малом числе карточек
  // они оставались бы на минимальном размере, а свободное 1fr-пространство уходило бы в
  // невидимые пустые колонки вместо того, чтобы растянуть существующие карточки на весь экран.
  const cardGridStyle = { gridTemplateColumns: `repeat(auto-fit, minmax(${CARD_SIZE_TO_MIN_PX[draftCardSize]}px, 1fr))` };

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

  const showAdjectiveStep = Boolean(activeCategory) && sb.needsAdjectiveStep;

  const favoriteCardIds = new Set(favorites.map((f) => f.cardId));
  const visibleFavoriteCards: Card[] = favoriteCards.filter((c) => favoriteCardIds.has(c.id));

  const { data: schedules = [] } = useSchedules(childId);
  const completeItem = useCompleteScheduleItem(childId);
  const deleteCard = useDeleteCard();
  const toggleFavorite = useToggleFavorite(childId);

  function handleToggleFavorite(cardId: string) {
    if (favoriteCardIds.has(cardId)) {
      toggleFavorite.remove.mutate(cardId);
    } else {
      toggleFavorite.add.mutate(cardId);
    }
  }

  const showBuilderPanel = activeCategory !== null && difficultyLevel !== 1 && (sb.builderWords.length > 0 || !showAdjectiveStep);
  const showYesNo = activeTab !== SCHEDULE_TAB;

  function handleFavoriteTap(card: Card) {
    const ownerCategory = categories.find((c) => c.id === card.categoryId);
    if (!ownerCategory) return;
    sb.speakImmediately(ownerCategory, card);
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: tokens.background }}>
      <nav
        className="flex items-center gap-2 overflow-x-auto p-3"
        style={{ borderBottom: `1px solid ${tokens.border}` }}
      >
        <CategoryPill
          label="Избранное"
          icon="star"
          color={FAVORITES_PILL_COLOR}
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
        <CategoryPill
          label="Расписание"
          icon="calendar"
          color={SCHEDULE_PILL_COLOR}
          active={activeTab === SCHEDULE_TAB}
          onClick={() => setActiveTab(SCHEDULE_TAB)}
        />

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
          <span style={{ fontSize: 14, color: tokens.textSecondary }}>Размер карточек:</span>
          {CARD_SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={draftCardSize === option.value}
              onClick={() => setDraftCardSize(option.value)}
              className="px-3 py-1 focus:outline-none focus-visible:ring-4"
              style={{
                borderRadius: 999,
                fontSize: 14,
                backgroundColor: draftCardSize === option.value ? tokens.accentSoft : tokens.surfaceMuted,
                color: draftCardSize === option.value ? tokens.accentText : tokens.textSecondary,
                // @ts-expect-error CSS custom property for focus ring color
                "--tw-ring-color": tokens.focusRing,
              }}
            >
              {option.label}
            </button>
          ))}
          <Button
            type="button"
            className="ml-auto"
            disabled={!isCardSizeDirty || updateChild.isPending}
            onClick={() => updateChild.mutate({ cardSize: draftCardSize })}
          >
            {updateChild.isPending ? "Сохраняем..." : "Сохранить"}
          </Button>
        </div>
      ) : null}

      <main className="flex-1 overflow-y-auto p-4 pb-40">
        {activeTab === SCHEDULE_TAB ? (
          <div className="flex flex-col gap-6">
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
          <div className="grid gap-2" style={cardGridStyle}>
            {visibleFavoriteCards.map((card) => (
              <CardButton
                key={card.id}
                title={card.title}
                imageUrl={card.imageUrl}
                accentColor={card.color}
                size={cardButtonSize}
                // В режиме редактирования тап открывает редактирование, как и в обычной
                // сетке категории — раньше вкладка «Избранное» (открытая по умолчанию) не
                // поддерживала ни редактирование, ни удаление вовсе.
                onClick={() => (isEditMode ? setEditingCard(card) : handleFavoriteTap(card))}
                onDelete={isEditMode ? () => deleteCard.mutate(card.id) : undefined}
                favorite
                onToggleFavorite={() => handleToggleFavorite(card.id)}
              />
            ))}
          </div>
        ) : activeCategory ? (
          <div className="grid gap-2" style={cardGridStyle}>
            {sortFavoritesFirst(showAdjectiveStep ? adjectiveCards : nounCards, favoriteCardIds).map((card) => (
              <CardButton
                key={card.id}
                title={card.title}
                imageUrl={card.imageUrl}
                accentColor={card.color}
                size={cardButtonSize}
                selected={showAdjectiveStep ? sb.adjective?.id === card.id : sb.noun?.id === card.id}
                // В режиме редактирования тап по карточке открывает редактирование, а не
                // выбирает её для фразы — включая библиотечные карточки, не только кастомные
                // (явное продуктовое решение; бэкенд по-прежнему защищает только Да/Нет).
                onClick={() =>
                  isEditMode ? setEditingCard(card) : showAdjectiveStep ? sb.selectAdjective(card) : sb.selectNoun(card)
                }
                onDelete={isEditMode ? () => deleteCard.mutate(card.id) : undefined}
                favorite={favoriteCardIds.has(card.id)}
                onToggleFavorite={() => handleToggleFavorite(card.id)}
              />
            ))}
            {isEditMode && !showAdjectiveStep ? (
              <AddCardTile onClick={() => setIsAddModalOpen(true)} />
            ) : null}
          </div>
        ) : null}
      </main>

      <footer
        className="fixed inset-x-0 bottom-0 flex flex-col"
        style={{ borderTop: `1px solid ${tokens.border}`, backgroundColor: tokens.background }}
      >
        {showBuilderPanel ? (
          <div className="p-3">
            <SentenceBuilderPanel
              words={sb.builderWords.map((card) => ({ id: card.id, title: card.title }))}
              onRemoveWord={sb.removeBuilderWordAt}
              onSpeak={() => sb.speak()}
            />
          </div>
        ) : null}
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
    </div>
  );
}

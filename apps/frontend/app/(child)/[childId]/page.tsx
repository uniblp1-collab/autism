"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AddCardTile,
  Button,
  CardButton,
  CategoryPill,
  Icon,
  Input,
  Modal,
  ScheduleTile,
  SentenceBuilderPanel,
  YesNoStickyPanel,
  useTheme,
} from "@autism-connect/ui";
import { Card, CardType, Category } from "@autism-connect/shared";
import { useCategories, useCards, useCreateCard, useDeleteCard } from "../../../features/cards/useCards";
import { useFavorites } from "../../../features/cards/useFavorites";
import { useChild } from "../../../features/children/useChildren";
import { useSentenceBuilder } from "../../../features/sentence-builder/useSentenceBuilder";
import { useCompleteScheduleItem, useSchedules } from "../../../features/schedule/useSchedules";

const FAVORITES_TAB = "__favorites__";
const SCHEDULE_TAB = "__schedule__";
const FAVORITES_COLOR = "#633806"; // тон "Эмоции" — переиспользуется для пилюли «Избранное»
const SCHEDULE_COLOR = "#0C447C"; // тон "Транспорт" — переиспользуется для пилюли «Расписание»

// Режим редактирования (ТЗ §A.7) пока не защищён PIN-кодом — см. .env.example.
const EDIT_MODE_ENABLED = process.env.NEXT_PUBLIC_EDIT_MODE_ENABLED !== "false";

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

  const activeCategory = unlockedCategories.find((c) => c.id === activeTab) ?? null;

  const { data: yesNoCards = [] } = useCards({ isSystemCard: true });
  const { data: favoriteCards = [] } = useCards({ childId, includeCustom: true, cardType: CardType.NOUN });

  const sb = useSentenceBuilder({ childId, difficultyLevel });

  // Пересинхронизируем состояние сборки фразы только при смене вкладки категории —
  // sb.selectCategory намеренно не входит в зависимости, чтобы не создавать цикл
  // (это стабильный колбэк из zustand-стора, ре-рендер по нему не нужен).
  const selectCategory = sb.selectCategory;
  useEffect(() => {
    if (activeCategory) selectCategory(activeCategory);
  }, [activeTab, activeCategory, selectCategory]);

  const showAdjectiveStep = Boolean(activeCategory) && sb.needsAdjectiveStep;
  const { data: adjectiveCards = [] } = useCards({ cardType: CardType.ADJECTIVE });
  const { data: nounCards = [] } = useCards({
    categoryId: activeCategory?.id,
    childId,
    includeCustom: true,
    cardType: CardType.NOUN,
  });

  const favoriteCardIds = new Set(favorites.map((f) => f.cardId));
  const visibleFavoriteCards: Card[] = favoriteCards.filter((c) => favoriteCardIds.has(c.id));

  const { data: schedules = [] } = useSchedules(childId);
  const completeItem = useCompleteScheduleItem(childId);
  const deleteCard = useDeleteCard();

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
          color={FAVORITES_COLOR}
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
          color={SCHEDULE_COLOR}
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
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {visibleFavoriteCards.map((card) => (
              <CardButton
                key={card.id}
                title={card.title}
                imageUrl={card.imageUrl}
                accentColor={card.color}
                onClick={() => handleFavoriteTap(card)}
              />
            ))}
          </div>
        ) : activeCategory ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {(showAdjectiveStep ? adjectiveCards : nounCards).map((card) => (
              <CardButton
                key={card.id}
                title={card.title}
                imageUrl={card.imageUrl}
                accentColor={card.color}
                selected={showAdjectiveStep ? sb.adjective?.id === card.id : sb.noun?.id === card.id}
                onClick={() => (showAdjectiveStep ? sb.selectAdjective(card) : sb.selectNoun(card))}
                onDelete={isEditMode ? () => deleteCard.mutate(card.id) : undefined}
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
        {showYesNo && yesNoCards.length === 2 ? (
          <YesNoStickyPanel
            yesCard={yesNoCards[0]}
            noCard={yesNoCards[1]}
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
    </div>
  );
}

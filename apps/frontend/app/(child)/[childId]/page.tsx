"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CardButton,
  CategoryPill,
  ScheduleTile,
  SentenceBuilderPanel,
  useTheme,
} from "@autism-connect/ui";
import { Card } from "@autism-connect/shared";
import { useCategories, useCards } from "../../../features/cards/useCards";
import { useFavorites } from "../../../features/cards/useFavorites";
import { useSentenceBuilder } from "../../../features/sentence-builder/useSentenceBuilder";
import { useCompleteScheduleItem, useSchedules } from "../../../features/schedule/useSchedules";

const FAVORITES_TAB = "__favorites__";
const SCHEDULE_TAB = "__schedule__";
const FAVORITES_COLOR = "#633806"; // тон "Эмоции" — переиспользуется для пилюли «Избранное»
const SCHEDULE_COLOR = "#0C447C"; // тон "Транспорт" — переиспользуется для пилюли «Расписание»

export default function ChildScreenPage() {
  const params = useParams<{ childId: string }>();
  const childId = params.childId;
  const { tokens } = useTheme();

  const { data: categories = [] } = useCategories();
  const { data: favorites = [] } = useFavorites(childId);
  const [activeTab, setActiveTab] = useState<string>(FAVORITES_TAB);

  const activeCategoryId = activeTab === FAVORITES_TAB || activeTab === SCHEDULE_TAB ? undefined : activeTab;
  const { data: cards = [] } = useCards({ categoryId: activeCategoryId, childId, includeCustom: true });

  const favoriteCardIds = useMemo(() => new Set(favorites.map((f) => f.cardId)), [favorites]);
  const visibleCards: Card[] = activeTab === FAVORITES_TAB ? cards.filter((c) => favoriteCardIds.has(c.id)) : cards;

  const { selectedCards, addCard, removeAt, speak } = useSentenceBuilder(childId);
  const { data: schedules = [] } = useSchedules(childId);
  const completeItem = useCompleteScheduleItem(childId);

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: tokens.background }}>
      <nav className="flex gap-2 overflow-x-auto p-3" style={{ borderBottom: `1px solid ${tokens.border}` }}>
        <CategoryPill
          label="Избранное"
          icon="star"
          color={FAVORITES_COLOR}
          active={activeTab === FAVORITES_TAB}
          onClick={() => setActiveTab(FAVORITES_TAB)}
        />
        {categories.map((category) => (
          <CategoryPill
            key={category.id}
            label={category.title}
            icon={category.icon}
            color={category.color}
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
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {visibleCards.map((card) => (
              <CardButton
                key={card.id}
                title={card.title}
                imageUrl={card.imageUrl}
                accentColor={card.color}
                onClick={() => addCard(card)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 p-3" style={{ borderTop: `1px solid ${tokens.border}`, backgroundColor: tokens.background }}>
        <SentenceBuilderPanel
          words={selectedCards.map((card) => ({ id: card.id, title: card.title }))}
          onRemoveWord={removeAt}
          onSpeak={() => speak()}
        />
      </footer>
    </div>
  );
}

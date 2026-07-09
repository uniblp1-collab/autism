"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CardButton, MIN_TOUCH_TARGET_PX } from "@autism-connect/ui";
import { Card } from "@autism-connect/shared";
import { useCategories, useCards } from "../../../features/cards/useCards";
import { useFavorites } from "../../../features/cards/useFavorites";
import { useSentenceBuilder } from "../../../features/sentence-builder/useSentenceBuilder";
import { useCompleteScheduleItem, useSchedules } from "../../../features/schedule/useSchedules";

const FAVORITES_TAB = "__favorites__";
const SCHEDULE_TAB = "__schedule__";

export default function ChildScreenPage() {
  const params = useParams<{ childId: string }>();
  const childId = params.childId;

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
    <div className="flex min-h-screen flex-col">
      <nav className="flex gap-2 overflow-x-auto border-b-2 border-gray-200 p-3">
        <button
          type="button"
          onClick={() => setActiveTab(FAVORITES_TAB)}
          className="shrink-0 rounded-xl border-2 px-4 py-2 text-sm font-semibold"
          aria-pressed={activeTab === FAVORITES_TAB}
        >
          ⭐ Избранное
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveTab(category.id)}
            className="shrink-0 rounded-xl border-2 px-4 py-2 text-sm font-semibold"
            aria-pressed={activeTab === category.id}
          >
            {category.icon} {category.title}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setActiveTab(SCHEDULE_TAB)}
          className="shrink-0 rounded-xl border-2 px-4 py-2 text-sm font-semibold"
          aria-pressed={activeTab === SCHEDULE_TAB}
        >
          📅 Расписание
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 pb-40">
        {activeTab === SCHEDULE_TAB ? (
          <div className="flex flex-col gap-4">
            {schedules.map((schedule) => (
              <section key={schedule.id}>
                <h2 className="mb-2 text-lg font-bold">{schedule.title}</h2>
                <div className="flex flex-col gap-2">
                  {schedule.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => completeItem.mutate({ itemId: item.id, isCompleted: !item.isCompleted })}
                      className="flex items-center gap-3 rounded-xl border-2 p-4 text-left text-lg"
                      style={{ minHeight: MIN_TOUCH_TARGET_PX }}
                    >
                      <span aria-hidden>{item.isCompleted ? "✅" : "⬜"}</span>
                      {item.title}
                    </button>
                  ))}
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

      <footer className="fixed inset-x-0 bottom-0 flex items-center gap-3 border-t-2 border-gray-200 bg-white p-3">
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {selectedCards.map((card, index) => (
            <button
              key={`${card.id}-${index}`}
              type="button"
              onClick={() => removeAt(index)}
              className="shrink-0 rounded-lg border-2 px-3 py-2 text-sm"
              style={{ borderColor: card.color }}
            >
              {card.title}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => speak()}
          disabled={selectedCards.length === 0}
          className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3 text-lg font-bold text-white disabled:opacity-40"
          style={{ minHeight: MIN_TOUCH_TARGET_PX, minWidth: MIN_TOUCH_TARGET_PX }}
        >
          🔊 Сказать
        </button>
      </footer>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button, Input } from "@autism-connect/ui";
import { useCategories, useCards, useCreateCard } from "../../../features/cards/useCards";
import { useUiStore } from "../../../store/uiStore";

export default function CardsPage() {
  const selectedChildId = useUiStore((state) => state.selectedChildId);
  const { data: categories = [] } = useCategories();
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState("");
  const { data: cards = [], isLoading } = useCards({ categoryId, query: query || undefined });

  const createCard = useCreateCard();
  const [title, setTitle] = useState("");
  const [ttsText, setTtsText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!formCategoryId) return;
    await createCard.mutateAsync({
      categoryId: formCategoryId,
      childId: selectedChildId ?? undefined,
      title,
      ttsText: ttsText || title,
      imageUrl: imageUrl || "/cards/custom/placeholder.svg",
    });
    setTitle("");
    setTtsText("");
    setImageUrl("");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Библиотека карточек</h1>
          {selectedChildId ? (
            <Link href={`/${selectedChildId}`} className="text-sm underline">
              Открыть экран ребёнка →
            </Link>
          ) : null}
        </div>
        <div className="mb-4 flex flex-wrap gap-4">
          <select
            className="rounded-lg border-2 border-gray-300 px-3 py-2 text-sm"
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value || undefined)}
          >
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.title}
              </option>
            ))}
          </select>
          <Input placeholder="Поиск по названию" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {isLoading ? <p>Загрузка...</p> : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map((card) => (
            <div key={card.id} className="rounded-xl border-2 p-2 text-center text-sm" style={{ borderColor: card.color }}>
              {card.title}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Добавить кастомную карточку</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Категория
            <select
              className="rounded-lg border-2 border-gray-300 px-3 py-2"
              required
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
            >
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.title}
                </option>
              ))}
            </select>
          </label>
          <Input label="Название" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            label="Текст для озвучивания (необязательно)"
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
          />
          <Input label="URL изображения" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <Button type="submit" disabled={createCard.isPending}>
            {createCard.isPending ? "Сохраняем..." : "Добавить карточку"}
          </Button>
        </form>
      </section>
    </div>
  );
}

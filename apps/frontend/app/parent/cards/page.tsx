"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, CardButton, Input, useTheme } from "@autism-connect/ui";
import { CardType } from "@autism-connect/shared";
import { useCategories, useCards, useCreateCard } from "../../../features/cards/useCards";
import { useUiStore } from "../../../store/uiStore";

export default function CardsPage() {
  return (
    <Suspense fallback={null}>
      <CardsPageContent />
    </Suspense>
  );
}

function CardsPageContent() {
  const { tokens } = useTheme();
  const selectedChildId = useUiStore((state) => state.selectedChildId);
  const searchParams = useSearchParams();
  const { data: categories = [] } = useCategories();
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState("");
  const { data: cards = [], isLoading } = useCards({ categoryId, query: query || undefined, cardType: CardType.NOUN });

  const createCard = useCreateCard();
  const [title, setTitle] = useState("");
  const [ttsPhrase, setTtsPhrase] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  // Плитка «Добавить» в режиме редактирования экрана ребёнка ведёт сюда с предзаполненной
  // категорией — полная форма создания карточки уже реализована здесь, дублировать её
  // в самом экране ребёнка незачем.
  const [formCategoryId, setFormCategoryId] = useState(searchParams.get("categoryId") ?? "");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!formCategoryId) return;
    await createCard.mutateAsync({
      categoryId: formCategoryId,
      childId: selectedChildId ?? undefined,
      title,
      ttsPhrase: ttsPhrase || title,
      imageUrl: imageUrl || undefined,
    });
    setTitle("");
    setTtsPhrase("");
    setImageUrl("");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <section>
        <h1 className="mb-4 text-xl font-medium">Библиотека карточек</h1>
        <div className="mb-4 flex flex-wrap gap-4">
          <select
            className="px-3 py-2"
            style={{ border: `1px solid ${tokens.border}`, borderRadius: 10, fontSize: 14, backgroundColor: tokens.surface }}
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value || undefined)}
          >
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
          <Input placeholder="Поиск по названию" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {isLoading ? <p>Загрузка...</p> : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map((card) => (
            <CardButton key={card.id} title={card.title} imageUrl={card.imageUrl} accentColor={card.color} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Добавить кастомную карточку</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Категория
            <select
              className="px-3 py-2"
              style={{ border: `1px solid ${tokens.border}`, borderRadius: 10, backgroundColor: tokens.surface }}
              required
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
            >
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>
          <Input label="Подпись на карточке" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            label="Что произносить (напр. «Идём во двор»; по умолчанию — подпись)"
            value={ttsPhrase}
            onChange={(e) => setTtsPhrase(e.target.value)}
          />
          <Input label="URL изображения (необязательно)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <Button type="submit" disabled={createCard.isPending}>
            {createCard.isPending ? "Сохраняем..." : "Добавить карточку"}
          </Button>
        </form>
      </section>
    </div>
  );
}

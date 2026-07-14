"use client";

import { ChangeEvent, useState } from "react";
import Image from "next/image";
import { resolveCategoryColorToken, useTheme } from "@autism-connect/ui";
import { useCards, useCategories } from "../../../../features/cards/useCards";
import { useUploadCardImage } from "../../../../features/admin/useAdmin";

export default function AdminCardsPage() {
  const { tokens } = useTheme();
  const { data: categories = [] } = useCategories();
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const { data: cards = [], isLoading } = useCards({ categoryId });
  const uploadImage = useUploadCardImage();
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  async function handleFileChange(cardId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingCardId(cardId);
    setFailedImageIds((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
    try {
      await uploadImage.mutateAsync({ cardId, file });
    } finally {
      setUploadingCardId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 style={{ fontSize: 20, fontWeight: 500, color: tokens.textPrimary }}>Картинки карточек</h1>
      <select
        className="w-fit px-3 py-2"
        style={{ border: `1px solid ${tokens.border}`, borderRadius: 10, backgroundColor: tokens.surface }}
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

      {isLoading ? <p>Загрузка...</p> : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => {
          const tone = resolveCategoryColorToken(card.color);
          return (
            <div
              key={card.id}
              className="flex flex-col items-center gap-2 text-center"
              style={{ backgroundColor: tokens.surface, borderRadius: 14, padding: 16 }}
            >
              {card.imageUrl && !failedImageIds.has(card.id) ? (
                <Image
                  src={card.imageUrl}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  className="h-16 w-16 object-contain"
                  onError={() => setFailedImageIds((prev) => new Set(prev).add(card.id))}
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center text-center"
                  style={{ backgroundColor: tone.bg, color: tone.fg, borderRadius: 10, fontSize: 11 }}
                >
                  {card.imageUrl ? "ошибка загрузки" : "нет фото"}
                </div>
              )}
              <p style={{ fontSize: 14, fontWeight: 500, color: tokens.textPrimary }}>{card.title}</p>
              <label style={{ fontSize: 12, fontWeight: 500, color: tokens.accentText, cursor: "pointer" }}>
                {uploadingCardId === card.id ? "Загрузка..." : "Заменить фото"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(card.id, e)}
                />
              </label>
            </div>
          );
        })}
        {!isLoading && cards.length === 0 ? (
          <p style={{ fontSize: 14, color: tokens.textSecondary }}>Карточек в этой категории пока нет.</p>
        ) : null}
      </div>
    </div>
  );
}

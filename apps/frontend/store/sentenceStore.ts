"use client";

import { create } from "zustand";

// Редакция 3 механики (ТЗ §A): фраза — это глагол (Category) + опционально прилагательное
// (только уровень сложности 3) + существительное, а не произвольная цепочка карточек.
// Стор хранит только id выбранных сущностей, а не сами объекты — сами Card/Category уже
// живут в кэше React Query (useCards/useCategories), дублировать их здесь запрещено
// правилом CLAUDE.md §5.2. Разрешение id -> объект делает useSentenceBuilder.
interface SentenceState {
  categoryId: string | null;
  adjectiveId: string | null;
  nounId: string | null;
  setCategoryId: (categoryId: string | null) => void;
  setAdjectiveId: (adjectiveId: string | null) => void;
  setNounId: (nounId: string | null) => void;
  reset: () => void;
}

export const useSentenceStore = create<SentenceState>((set) => ({
  categoryId: null,
  adjectiveId: null,
  nounId: null,
  setCategoryId: (categoryId) => set({ categoryId, adjectiveId: null, nounId: null }),
  setAdjectiveId: (adjectiveId) => set({ adjectiveId }),
  setNounId: (nounId) => set({ nounId }),
  reset: () => set({ adjectiveId: null, nounId: null }),
}));

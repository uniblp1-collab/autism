"use client";

import { create } from "zustand";
import { Card, Category } from "@autism-connect/shared";

// Редакция 3 механики (ТЗ §A): фраза — это глагол (Category) + опционально прилагательное
// (только уровень сложности 3) + существительное, а не произвольная цепочка карточек.
interface SentenceState {
  category: Category | null;
  adjective: Card | null;
  noun: Card | null;
  setCategory: (category: Category | null) => void;
  setAdjective: (card: Card | null) => void;
  setNoun: (card: Card | null) => void;
  reset: () => void;
}

export const useSentenceStore = create<SentenceState>((set) => ({
  category: null,
  adjective: null,
  noun: null,
  setCategory: (category) => set({ category, adjective: null, noun: null }),
  setAdjective: (adjective) => set({ adjective }),
  setNoun: (noun) => set({ noun }),
  reset: () => set({ adjective: null, noun: null }),
}));

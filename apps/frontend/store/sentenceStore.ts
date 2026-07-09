"use client";

import { create } from "zustand";
import { Card } from "@autism-connect/shared";

interface SentenceState {
  selectedCards: Card[];
  addCard: (card: Card) => void;
  removeAt: (index: number) => void;
  clear: () => void;
}

export const useSentenceStore = create<SentenceState>((set) => ({
  selectedCards: [],
  addCard: (card) => set((state) => ({ selectedCards: [...state.selectedCards, card] })),
  removeAt: (index) => set((state) => ({ selectedCards: state.selectedCards.filter((_, i) => i !== index) })),
  clear: () => set({ selectedCards: [] }),
}));

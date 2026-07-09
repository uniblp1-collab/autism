"use client";

import { create } from "zustand";

interface UiState {
  selectedChildId: string | null;
  setSelectedChildId: (childId: string | null) => void;
  activeModal: string | null;
  openModal: (name: string) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedChildId: null,
  setSelectedChildId: (childId) => set({ selectedChildId: childId }),
  activeModal: null,
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
}));

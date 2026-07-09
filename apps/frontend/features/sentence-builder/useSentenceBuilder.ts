"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@autism-connect/shared";
import { useSentenceStore } from "../../store/sentenceStore";
import { apiFetch } from "../../shared/api/client";
import { speakText } from "../tts/useTts";

export function useSentenceBuilder(childId: string | null) {
  const selectedCards = useSentenceStore((state) => state.selectedCards);
  const addCard = useSentenceStore((state) => state.addCard);
  const removeAt = useSentenceStore((state) => state.removeAt);
  const clear = useSentenceStore((state) => state.clear);
  const queryClient = useQueryClient();

  const logSentence = useMutation({
    mutationFn: (cardIds: string[]) =>
      apiFetch("/history", { method: "POST", body: JSON.stringify({ childId, cardIds }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["history", childId] }),
  });

  const recordUsage = useCallback(
    (cardId: string) =>
      apiFetch("/statistics/record-usage", { method: "POST", body: JSON.stringify({ childId, cardId }) }),
    [childId],
  );

  const speak = useCallback(
    (speakFn: (text: string) => void = speakText) => {
      if (selectedCards.length === 0 || !childId) return;

      const cardIds = selectedCards.map((card: Card) => card.id);
      const text = selectedCards.map((card: Card) => card.ttsText).join(" ");

      speakFn(text);
      logSentence.mutate(cardIds);
      cardIds.forEach((id) => recordUsage(id));
      clear();
    },
    [selectedCards, childId, logSentence, recordUsage, clear],
  );

  return { selectedCards, addCard, removeAt, clear, speak };
}

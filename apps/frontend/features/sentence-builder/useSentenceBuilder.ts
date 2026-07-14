"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Category } from "@autism-connect/shared";
import { useSentenceStore } from "../../store/sentenceStore";
import { apiFetch } from "../../shared/api/client";
import { speakText } from "../tts/useTts";
import { buildSentenceText } from "./sentenceEngine";

export type DifficultyLevel = 1 | 2 | 3;

interface UseSentenceBuilderParams {
  childId: string | null;
  difficultyLevel: DifficultyLevel;
  /** Списки уже загружены React Query на странице — используются только для разрешения id -> объект. */
  categories: Category[];
  adjectiveCards: Card[];
  nounCards: Card[];
}

/**
 * Состояние сборки фразы для новой механики (ТЗ §A.4/A.7):
 *  - уровень 1: тап по существительному сразу озвучивает "{глагол} {сущ.}", строки сборки нет;
 *  - уровень 2: тап по существительному только выставляет его в строку сборки, озвучивание — по кнопке;
 *  - уровень 3: то же, что уровень 2, но перед существительным обязателен шаг выбора прилагательного
 *    (согласование по роду существительного — см. sentenceEngine.ts).
 */
export function useSentenceBuilder({
  childId,
  difficultyLevel,
  categories,
  adjectiveCards,
  nounCards,
}: UseSentenceBuilderParams) {
  const categoryId = useSentenceStore((state) => state.categoryId);
  const adjectiveId = useSentenceStore((state) => state.adjectiveId);
  const nounId = useSentenceStore((state) => state.nounId);
  const setCategoryId = useSentenceStore((state) => state.setCategoryId);
  const setAdjectiveId = useSentenceStore((state) => state.setAdjectiveId);
  const setNounId = useSentenceStore((state) => state.setNounId);
  const reset = useSentenceStore((state) => state.reset);
  const queryClient = useQueryClient();

  const category = useMemo(() => categories.find((c) => c.id === categoryId) ?? null, [categories, categoryId]);
  const adjective = useMemo(
    () => adjectiveCards.find((c) => c.id === adjectiveId) ?? null,
    [adjectiveCards, adjectiveId],
  );
  const noun = useMemo(() => nounCards.find((c) => c.id === nounId) ?? null, [nounCards, nounId]);

  const logSentence = useMutation({
    mutationFn: (payload: { cardIds: string[]; sentenceText: string }) =>
      apiFetch("/history", {
        method: "POST",
        body: JSON.stringify({ childId, cardIds: payload.cardIds, sentenceText: payload.sentenceText }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["history", childId] }),
  });

  const recordUsage = useCallback(
    (cardId: string) =>
      apiFetch("/statistics/record-usage", { method: "POST", body: JSON.stringify({ childId, cardId }) }),
    [childId],
  );

  const logAndSpeak = useCallback(
    (cardIds: string[], sentenceText: string, speakFn: (text: string) => void) => {
      if (!childId) return;
      speakFn(sentenceText);
      logSentence.mutate({ cardIds, sentenceText });
      cardIds.forEach((id) => recordUsage(id));
    },
    [childId, logSentence, recordUsage],
  );

  const commit = useCallback(
    (activeCategory: Category, activeNoun: Card, activeAdjective: Card | null, speakFn: (text: string) => void) => {
      const sentenceText = buildSentenceText({ category: activeCategory, noun: activeNoun, adjective: activeAdjective });
      const cardIds = activeAdjective ? [activeAdjective.id, activeNoun.id] : [activeNoun.id];
      logAndSpeak(cardIds, sentenceText, speakFn);
      reset();
    },
    [logAndSpeak, reset],
  );

  // Да/Нет (isSystemCard) не участвуют в шаблоне глагол+сущ. — озвучиваются напрямую
  // своим ttsText, но всё равно логируются в историю/статистику как обычная карточка.
  const speakSystemCard = useCallback(
    (card: Card, speakFn: (text: string) => void = speakText) => {
      logAndSpeak([card.id], card.ttsText, speakFn);
    },
    [logAndSpeak],
  );

  const selectCategory = useCallback(
    (nextCategory: Category) => {
      setCategoryId(nextCategory.id);
    },
    [setCategoryId],
  );

  const selectAdjective = useCallback(
    (card: Card) => {
      setAdjectiveId(card.id);
    },
    [setAdjectiveId],
  );

  const selectNoun = useCallback(
    (card: Card, speakFn: (text: string) => void = speakText) => {
      if (!category) return;

      // На уровне 3 существительное недоступно, пока не выбрано прилагательное — страница
      // не должна показывать сетку существительных в этом состоянии, но хук тоже это гарантирует.
      if (difficultyLevel === 3 && !adjective) return;

      if (difficultyLevel === 1) {
        commit(category, card, null, speakFn);
        return;
      }

      setNounId(card.id);
    },
    [category, difficultyLevel, adjective, commit, setNounId],
  );

  const speak = useCallback(
    (speakFn: (text: string) => void = speakText) => {
      if (!category || !noun) return;
      commit(category, noun, difficultyLevel === 3 ? adjective : null, speakFn);
    },
    [category, noun, adjective, difficultyLevel, commit],
  );

  // Для «Избранного»: карточка озвучивается сразу по тапу независимо от уровня сложности,
  // минуя шаг выбора прилагательного — избранное существует именно для быстрого доступа.
  const speakImmediately = useCallback(
    (targetCategory: Category, targetNoun: Card, speakFn: (text: string) => void = speakText) => {
      commit(targetCategory, targetNoun, null, speakFn);
    },
    [commit],
  );

  const needsAdjectiveStep = difficultyLevel === 3 && Boolean(category) && !adjective;
  const needsNounStep = Boolean(category) && !needsAdjectiveStep && !noun;

  const builderWords = useMemo(() => {
    const words: Card[] = [];
    if (difficultyLevel === 3 && adjective) words.push(adjective);
    if (noun) words.push(noun);
    return words;
  }, [difficultyLevel, adjective, noun]);

  const removeBuilderWordAt = useCallback(
    (index: number) => {
      const word = builderWords[index];
      if (!word) return;
      if (word.id === adjective?.id) {
        setAdjectiveId(null);
        return;
      }
      if (word.id === noun?.id) {
        setNounId(null);
      }
    },
    [builderWords, adjective, noun, setAdjectiveId, setNounId],
  );

  return {
    category,
    adjective,
    noun,
    selectCategory,
    selectAdjective,
    selectNoun,
    speak,
    speakImmediately,
    speakSystemCard,
    reset,
    needsAdjectiveStep,
    needsNounStep,
    builderWords,
    removeBuilderWordAt,
    isSubmitting: logSentence.isPending,
  };
}

import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Card, CardType, Category, Gender } from "@autism-connect/shared";
import { useSentenceBuilder } from "./useSentenceBuilder";
import { useSentenceStore } from "../../store/sentenceStore";

jest.mock("../../shared/api/client", () => ({
  apiFetch: jest.fn().mockResolvedValue(undefined),
}));

const { apiFetch } = jest.requireMock("../../shared/api/client") as { apiFetch: jest.Mock };

function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "category-give",
    title: "Дай",
    icon: "gift",
    color: "#4F46E5",
    order: 1,
    isSystem: true,
    isPrimary: true,
    isHiddenFromNav: false,
    phraseForm: "Дай",
    sentenceTemplate: "{verb} {noun}",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildNoun(overrides: Partial<Card> = {}): Card {
  return {
    id: "card-apple",
    categoryId: "category-give",
    childId: null,
    title: "Яблоко",
    imageUrl: "/img.svg",
    color: "#712B13",
    priority: 0,
    ttsText: "Яблоко",
    phraseForm: "яблоко",
    cardType: CardType.NOUN,
    gender: Gender.NEUTER,
    phraseFormMasculine: null,
    phraseFormFeminine: null,
    phraseFormNeuter: null,
    source: "LIBRARY" as Card["source"],
    isCustom: false,
    isSystemCard: false,
    width: null,
    height: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildAdjective(overrides: Partial<Card> = {}): Card {
  return {
    id: "card-green",
    categoryId: "category-adjectives",
    childId: null,
    title: "Зелёный",
    imageUrl: null,
    color: "#166534",
    priority: 0,
    ttsText: "Зелёный",
    phraseForm: "зелёный",
    cardType: CardType.ADJECTIVE,
    gender: null,
    phraseFormMasculine: "зелёный",
    phraseFormFeminine: "зелёная",
    phraseFormNeuter: "зелёное",
    source: "LIBRARY" as Card["source"],
    isCustom: false,
    isSystemCard: false,
    width: null,
    height: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const defaultCategories = [buildCategory()];
const defaultAdjectives = [buildAdjective()];
const defaultNouns = [buildNoun()];

function renderBuilder(difficultyLevel: 1 | 2 | 3, overrides: { nouns?: Card[]; adjectives?: Card[] } = {}) {
  return renderHook(
    () =>
      useSentenceBuilder({
        childId: "child-1",
        difficultyLevel,
        categories: defaultCategories,
        adjectiveCards: overrides.adjectives ?? defaultAdjectives,
        nounCards: overrides.nouns ?? defaultNouns,
      }),
    { wrapper },
  );
}

describe("useSentenceBuilder", () => {
  beforeEach(() => {
    useSentenceStore.getState().reset();
    useSentenceStore.setState({ categoryId: null, adjectiveId: null, nounId: null });
    apiFetch.mockClear();
  });

  it("level 1: speaks immediately on noun tap, without a visible builder row", async () => {
    const { result } = renderBuilder(1);
    const speakFn = jest.fn();

    act(() => result.current.selectCategory(buildCategory()));
    act(() => result.current.selectNoun(buildNoun(), speakFn));

    expect(speakFn).toHaveBeenCalledWith("Дай яблоко");
    expect(result.current.builderWords).toHaveLength(0);
    expect(result.current.noun).toBeNull();

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith(
        "/history",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ childId: "child-1", cardIds: ["card-apple"], sentenceText: "Дай яблоко" }),
        }),
      ),
    );
    expect(apiFetch).toHaveBeenCalledWith(
      "/statistics/record-usage",
      expect.objectContaining({ body: JSON.stringify({ childId: "child-1", cardId: "card-apple" }) }),
    );
  });

  it("level 2: noun tap fills the builder row without speaking; explicit speak() commits it", () => {
    const { result } = renderBuilder(2);
    const speakFn = jest.fn();

    act(() => result.current.selectCategory(buildCategory()));
    act(() => result.current.selectNoun(buildNoun()));

    expect(speakFn).not.toHaveBeenCalled();
    expect(result.current.builderWords.map((c) => c.id)).toEqual(["card-apple"]);

    act(() => result.current.speak(speakFn));

    expect(speakFn).toHaveBeenCalledWith("Дай яблоко");
    expect(result.current.builderWords).toHaveLength(0);
  });

  it("level 3: blocks noun selection until an adjective is chosen, then agrees gender in the sentence", () => {
    const { result } = renderBuilder(3);
    const speakFn = jest.fn();

    act(() => result.current.selectCategory(buildCategory()));
    expect(result.current.needsAdjectiveStep).toBe(true);

    act(() => result.current.selectNoun(buildNoun()));
    expect(result.current.noun).toBeNull(); // существительное недоступно без прилагательного

    act(() => result.current.selectAdjective(buildAdjective()));
    expect(result.current.needsAdjectiveStep).toBe(false);

    act(() => result.current.selectNoun(buildNoun({ gender: Gender.NEUTER })));
    expect(result.current.builderWords.map((c) => c.id)).toEqual(["card-green", "card-apple"]);

    act(() => result.current.speak(speakFn));

    // яблоко = средний род -> "зелёное", а не словарная форма "зелёный"
    expect(speakFn).toHaveBeenCalledWith("Дай зелёное яблоко");
  });

  it("speakImmediately bypasses the adjective step regardless of difficulty level (used by Избранное)", () => {
    const { result } = renderBuilder(3);
    const speakFn = jest.fn();

    act(() => result.current.speakImmediately(buildCategory(), buildNoun(), speakFn));

    expect(speakFn).toHaveBeenCalledWith("Дай яблоко");
  });

  it("speakSystemCard speaks a Да/Nет card's own ttsText and logs it", async () => {
    const { result } = renderBuilder(1);
    const speakFn = jest.fn();
    const yesCard = buildNoun({ id: "card-yes", title: "Да", ttsText: "Да", isSystemCard: true });

    act(() => result.current.speakSystemCard(yesCard, speakFn));

    expect(speakFn).toHaveBeenCalledWith("Да");
    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith(
        "/history",
        expect.objectContaining({
          body: JSON.stringify({ childId: "child-1", cardIds: ["card-yes"], sentenceText: "Да" }),
        }),
      ),
    );
  });

  it("does nothing when speaking with no noun selected", () => {
    const { result } = renderBuilder(2);
    const speakFn = jest.fn();

    act(() => result.current.selectCategory(buildCategory()));
    act(() => result.current.speak(speakFn));

    expect(speakFn).not.toHaveBeenCalled();
    expect(apiFetch).not.toHaveBeenCalled();
  });
});

import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Card } from "@autism-connect/shared";
import { useSentenceBuilder } from "./useSentenceBuilder";
import { useSentenceStore } from "../../store/sentenceStore";

jest.mock("../../shared/api/client", () => ({
  apiFetch: jest.fn().mockResolvedValue(undefined),
}));

const { apiFetch } = jest.requireMock("../../shared/api/client") as { apiFetch: jest.Mock };

function buildCard(id: string, ttsText: string): Card {
  return {
    id,
    categoryId: "category-1",
    childId: null,
    title: ttsText,
    imageUrl: "/img.svg",
    color: "#000",
    priority: 0,
    ttsText,
    source: "LIBRARY" as Card["source"],
    isCustom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useSentenceBuilder", () => {
  beforeEach(() => {
    useSentenceStore.getState().clear();
    apiFetch.mockClear();
  });

  it("accumulates cards added by the child", () => {
    const { result } = renderHook(() => useSentenceBuilder("child-1"), { wrapper });

    act(() => result.current.addCard(buildCard("card-1", "Хочу")));
    act(() => result.current.addCard(buildCard("card-2", "Яблоко")));

    expect(result.current.selectedCards.map((c) => c.ttsText)).toEqual(["Хочу", "Яблоко"]);
  });

  it("removes a single card by position", () => {
    const { result } = renderHook(() => useSentenceBuilder("child-1"), { wrapper });

    act(() => result.current.addCard(buildCard("card-1", "Хочу")));
    act(() => result.current.addCard(buildCard("card-2", "Яблоко")));
    act(() => result.current.removeAt(0));

    expect(result.current.selectedCards.map((c) => c.ttsText)).toEqual(["Яблоко"]);
  });

  it("speaks the joined sentence, logs history and usage, then clears the builder", async () => {
    const { result } = renderHook(() => useSentenceBuilder("child-1"), { wrapper });
    const speakFn = jest.fn();

    act(() => result.current.addCard(buildCard("card-1", "Хочу")));
    act(() => result.current.addCard(buildCard("card-2", "Яблоко")));

    act(() => result.current.speak(speakFn));

    expect(speakFn).toHaveBeenCalledWith("Хочу Яблоко");
    expect(result.current.selectedCards).toHaveLength(0);

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/history", expect.objectContaining({ method: "POST" })));
    expect(apiFetch).toHaveBeenCalledWith(
      "/statistics/record-usage",
      expect.objectContaining({ body: JSON.stringify({ childId: "child-1", cardId: "card-1" }) }),
    );
  });

  it("does nothing when speaking with an empty selection", () => {
    const { result } = renderHook(() => useSentenceBuilder("child-1"), { wrapper });
    const speakFn = jest.fn();

    act(() => result.current.speak(speakFn));

    expect(speakFn).not.toHaveBeenCalled();
    expect(apiFetch).not.toHaveBeenCalled();
  });
});

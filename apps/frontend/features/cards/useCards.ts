import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Category, CreateCardInput, SearchCardsInput } from "@autism-connect/shared";
import { apiFetch } from "../../shared/api/client";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/categories"),
    staleTime: 5 * 60_000,
  });
}

function toQueryString(filter: SearchCardsInput): string {
  const params = new URLSearchParams();
  if (filter.categoryId) params.set("categoryId", filter.categoryId);
  if (filter.childId) params.set("childId", filter.childId);
  if (filter.query) params.set("query", filter.query);
  if (filter.includeCustom) params.set("includeCustom", "true");
  if (filter.cardType) params.set("cardType", filter.cardType);
  if (filter.isSystemCard !== undefined) params.set("isSystemCard", String(filter.isSystemCard));
  return params.toString();
}

export function useCards(filter: SearchCardsInput) {
  return useQuery({
    queryKey: ["cards", filter],
    queryFn: () => apiFetch<Card[]>(`/cards?${toQueryString(filter)}`),
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardInput) =>
      apiFetch<Card>("/cards", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards"] }),
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => apiFetch<void>(`/cards/${cardId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards"] }),
  });
}

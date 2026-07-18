import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Category,
  CreateCardInput,
  SearchCardsInput,
  UpdateCardInput,
  UpdateCategoryInput,
} from "@autism-connect/shared";
import { apiFetch } from "../../shared/api/client";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/categories"),
    staleTime: 5 * 60_000,
  });
}

// Редактирование раздела (озвучка/название) из режима редактирования на экране ребёнка.
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, input }: { categoryId: string; input: UpdateCategoryInput }) =>
      apiFetch<Category>(`/categories/${categoryId}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
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

export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, input }: { cardId: string; input: UpdateCardInput }) =>
      apiFetch<Card>(`/cards/${cardId}`, { method: "PATCH", body: JSON.stringify(input) }),
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

// "Поставить карточку на первое место в разделе" — режим редактирования на экране ребёнка
// (см. CardsController.promote/PromoteCardUseCase на бэкенде).
export function usePromoteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, childId }: { cardId: string; childId: string }) =>
      apiFetch<Card>(`/cards/${cardId}/promote`, { method: "PATCH", body: JSON.stringify({ childId }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards"] }),
  });
}

// Доступно из режима редактирования на экране ребёнка — отдельная (не-админская) ручка,
// см. CardsController.uploadImage на бэкенде.
export function useUploadCardImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, file }: { cardId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiFetch<Card>(`/cards/${cardId}/image`, { method: "POST", body: formData });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards"] }),
  });
}

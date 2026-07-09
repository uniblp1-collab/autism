import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Favorite } from "@autism-connect/shared";
import { apiFetch } from "../../shared/api/client";

export function useFavorites(childId: string | null) {
  return useQuery({
    queryKey: ["favorites", childId],
    queryFn: () => apiFetch<Favorite[]>(`/favorites?childId=${childId}`),
    enabled: Boolean(childId),
  });
}

export function useToggleFavorite(childId: string | null) {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["favorites", childId] });

  const add = useMutation({
    mutationFn: (cardId: string) =>
      apiFetch<Favorite>("/favorites", { method: "POST", body: JSON.stringify({ childId, cardId }) }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (cardId: string) => apiFetch<void>(`/favorites/${childId}/${cardId}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  return { add, remove };
}

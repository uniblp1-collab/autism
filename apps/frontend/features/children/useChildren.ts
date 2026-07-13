import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Child, CreateChildInput, UpdateChildInput, UpdateChildSettingsInput } from "@autism-connect/shared";
import { apiFetch } from "../../shared/api/client";

const childrenKey = ["children"] as const;

export function useChildren() {
  return useQuery({
    queryKey: childrenKey,
    queryFn: () => apiFetch<Child[]>("/children"),
  });
}

export function useChild(childId: string | null) {
  return useQuery({
    queryKey: ["children", childId],
    queryFn: () => apiFetch<Child>(`/children/${childId}`),
    enabled: Boolean(childId),
  });
}

export function useUpdateChildSettings(childId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateChildSettingsInput) =>
      apiFetch<Child>(`/children/${childId}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: childrenKey });
      queryClient.invalidateQueries({ queryKey: ["children", childId] });
    },
  });
}

export function useUpdateChild(childId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateChildInput) =>
      apiFetch<Child>(`/children/${childId}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: childrenKey });
      queryClient.invalidateQueries({ queryKey: ["children", childId] });
    },
  });
}

export function useCreateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChildInput) =>
      apiFetch<Child>("/children", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: childrenKey }),
  });
}

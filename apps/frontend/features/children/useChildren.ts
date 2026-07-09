import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Child, CreateChildInput } from "@autism-connect/shared";
import { apiFetch } from "../../shared/api/client";

const childrenKey = ["children"] as const;

export function useChildren() {
  return useQuery({
    queryKey: childrenKey,
    queryFn: () => apiFetch<Child[]>("/children"),
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

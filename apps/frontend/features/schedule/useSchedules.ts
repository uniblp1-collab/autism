import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AddScheduleItemInput, CreateScheduleInput, Schedule } from "@autism-connect/shared";
import { apiFetch } from "../../shared/api/client";

export function useSchedules(childId: string | null) {
  return useQuery({
    queryKey: ["schedules", childId],
    queryFn: () => apiFetch<Schedule[]>(`/schedules?childId=${childId}`),
    enabled: Boolean(childId),
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateScheduleInput) =>
      apiFetch<Schedule>("/schedules", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ["schedules", variables.childId] }),
  });
}

export function useAddScheduleItem(childId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, input }: { scheduleId: string; input: AddScheduleItemInput }) =>
      apiFetch<Schedule>(`/schedules/${scheduleId}/items`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules", childId] }),
  });
}

export function useCompleteScheduleItem(childId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) =>
      apiFetch(`/schedules/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ isCompleted }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules", childId] }),
  });
}

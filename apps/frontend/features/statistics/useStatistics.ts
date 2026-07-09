import { useQuery } from "@tanstack/react-query";
import { DailyStatistic } from "@autism-connect/shared";
import { apiFetch } from "../../shared/api/client";

export function useStatistics(childId: string | null) {
  return useQuery({
    queryKey: ["statistics", childId],
    queryFn: () => apiFetch<DailyStatistic[]>(`/statistics?childId=${childId}`),
    enabled: Boolean(childId),
  });
}

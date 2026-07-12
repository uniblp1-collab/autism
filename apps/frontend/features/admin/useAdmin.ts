import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaginatedResult } from "@autism-connect/shared";
import { apiFetch } from "../../shared/api/client";

// Ответ администраторского эндпоинта — намеренно не полный User из @autism-connect/shared
// (без passwordHash и updatedAt), см. AdminController.toUserResponse на бэкенде.
export interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export function useAdminUsers(page: number, pageSize: number) {
  return useQuery({
    queryKey: ["admin", "users", page, pageSize],
    queryFn: () => apiFetch<PaginatedResult<AdminUser>>(`/admin/users?page=${page}&pageSize=${pageSize}`),
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      apiFetch<AdminUser>(`/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export interface ResetPasswordResult {
  userId: string;
  temporaryPassword: string;
}

// TODO(безопасность, MVP-упрощение): временный пароль приходит прямо в ответе API, без
// email-канала — см. TODO в apps/backend .../generate-temporary-password.ts. Не финальный дизайн.
export function useResetUserPassword() {
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch<ResetPasswordResult>(`/admin/users/${userId}/reset-password`, { method: "POST" }),
  });
}

export function useUploadCardImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, file }: { cardId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiFetch(`/admin/cards/${cardId}/image`, { method: "POST", body: formData });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards"] }),
  });
}

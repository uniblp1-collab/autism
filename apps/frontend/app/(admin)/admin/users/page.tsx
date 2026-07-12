"use client";

import { useState } from "react";
import { Button, useTheme } from "@autism-connect/ui";
import { useAdminUsers, useResetUserPassword, useSetUserActive } from "../../../../features/admin/useAdmin";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { tokens } = useTheme();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminUsers(page, PAGE_SIZE);
  const setActive = useSetUserActive();
  const resetPassword = useResetUserPassword();
  const [revealedPassword, setRevealedPassword] = useState<{ userId: string; password: string } | null>(null);

  async function handleResetPassword(userId: string) {
    const result = await resetPassword.mutateAsync(userId);
    setRevealedPassword({ userId, password: result.temporaryPassword });
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 style={{ fontSize: 20, fontWeight: 500, color: tokens.textPrimary }}>Родительские аккаунты</h1>
      {isLoading ? <p>Загрузка...</p> : null}

      <div className="flex flex-col gap-2">
        {(data?.items ?? []).map((user) => (
          <div
            key={user.id}
            className="flex flex-wrap items-center justify-between gap-3"
            style={{ backgroundColor: tokens.surface, borderRadius: 14, padding: 16 }}
          >
            <div>
              <p style={{ fontSize: 15, fontWeight: 500, color: tokens.textPrimary }}>{user.email}</p>
              <p style={{ fontSize: 13, fontWeight: 400, color: tokens.textSecondary }}>
                Зарегистрирован: {new Date(user.createdAt).toLocaleDateString("ru-RU")} ·{" "}
                {user.isActive ? "Активен" : "Заблокирован"}
              </p>
              {revealedPassword?.userId === user.id ? (
                <p style={{ fontSize: 13, fontWeight: 500, color: tokens.accentText }}>
                  Временный пароль: {revealedPassword.password}
                </p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={user.isActive ? "danger" : "secondary"}
                onClick={() => setActive.mutate({ userId: user.id, isActive: !user.isActive })}
                disabled={setActive.isPending}
              >
                {user.isActive ? "Заблокировать" : "Разблокировать"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleResetPassword(user.id)}
                disabled={resetPassword.isPending}
              >
                Сбросить пароль
              </Button>
            </div>
          </div>
        ))}
        {!isLoading && (data?.items.length ?? 0) === 0 ? (
          <p style={{ fontSize: 14, color: tokens.textSecondary }}>Родительских аккаунтов пока нет.</p>
        ) : null}
      </div>

      {data ? (
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Назад
          </Button>
          <span style={{ fontSize: 14, color: tokens.textSecondary }}>
            Стр. {data.page} из {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Вперёд
          </Button>
        </div>
      ) : null}
    </div>
  );
}

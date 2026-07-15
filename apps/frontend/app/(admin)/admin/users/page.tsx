"use client";

import { FormEvent, useState } from "react";
import { Button, Input, Modal, useTheme } from "@autism-connect/ui";
import {
  useAdminUsers,
  useCreateParent,
  useResetUserPassword,
  useSetUserActive,
} from "../../../../features/admin/useAdmin";
import { ApiError } from "../../../../shared/api/client";

const PAGE_SIZE = 20;

interface CreateParentModalProps {
  onClose: () => void;
  onCreated: (email: string, temporaryPassword: string) => void;
}

function CreateParentModal({ onClose, onCreated }: CreateParentModalProps) {
  const createParent = useCreateParent();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const result = await createParent.mutateAsync(email);
      onCreated(result.user.email, result.temporaryPassword);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось создать аккаунт");
    }
  }

  return (
    <Modal open onClose={onClose} title="Создать родительский аккаунт">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Email родителя"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={createParent.isPending}>
          {createParent.isPending ? "Создаём..." : "Создать"}
        </Button>
      </form>
    </Modal>
  );
}

interface TemporaryPasswordModalProps {
  email: string;
  temporaryPassword: string;
  onClose: () => void;
}

function TemporaryPasswordModal({ email, temporaryPassword, onClose }: TemporaryPasswordModalProps) {
  const { tokens } = useTheme();
  return (
    <Modal open onClose={onClose} title="Аккаунт создан">
      <div className="flex flex-col gap-3">
        <p style={{ fontSize: 14, color: tokens.textPrimary }}>
          {email}: временный пароль — <strong>{temporaryPassword}</strong>
        </p>
        <p style={{ fontSize: 13, color: tokens.danger }}>
          Сохраните или передайте родителю — это единственный раз, когда пароль виден. Дальше в базе
          хранится только его хэш.
        </p>
        <Button type="button" onClick={onClose}>
          Понятно
        </Button>
      </div>
    </Modal>
  );
}

export default function AdminUsersPage() {
  const { tokens } = useTheme();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminUsers(page, PAGE_SIZE);
  const setActive = useSetUserActive();
  const resetPassword = useResetUserPassword();
  const [revealedPassword, setRevealedPassword] = useState<{ userId: string; password: string } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{ email: string; temporaryPassword: string } | null>(null);

  async function handleResetPassword(userId: string) {
    const result = await resetPassword.mutateAsync(userId);
    setRevealedPassword({ userId, password: result.temporaryPassword });
  }

  function handleParentCreated(email: string, temporaryPassword: string) {
    setIsCreateModalOpen(false);
    setCreatedAccount({ email, temporaryPassword });
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 style={{ fontSize: 20, fontWeight: 500, color: tokens.textPrimary }}>Родительские аккаунты</h1>
        <Button type="button" onClick={() => setIsCreateModalOpen(true)}>
          Создать родителя
        </Button>
      </div>
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

      {isCreateModalOpen ? (
        <CreateParentModal onClose={() => setIsCreateModalOpen(false)} onCreated={handleParentCreated} />
      ) : null}
      {createdAccount ? (
        <TemporaryPasswordModal
          email={createdAccount.email}
          temporaryPassword={createdAccount.temporaryPassword}
          onClose={() => setCreatedAccount(null)}
        />
      ) : null}
    </div>
  );
}

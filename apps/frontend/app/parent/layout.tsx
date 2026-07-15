"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, useTheme } from "@autism-connect/ui";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { ChildSelector } from "../../shared/ui/ChildSelector";

const NAV_ITEMS = [
  { href: "/parent/children", label: "Дети" },
  { href: "/parent/cards", label: "Карточки" },
  { href: "/parent/schedule", label: "Расписание" },
  { href: "/parent/statistics", label: "Статистика" },
];

// Клиентская проверка роли — только UX-уровень (мгновенный редирект без мигания
// родительского интерфейса для ADMIN-аккаунта), см. тот же паттерн в (admin)/layout.tsx.
// Настоящая защита — сами API-эндпоинты бэкенда, эта проверка её не заменяет.
export default function ParentLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { tokens } = useTheme();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const selectedChildId = useUiStore((state) => state.selectedChildId);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [user, router]);

  if (!user || user.role === "ADMIN") return null;

  function handleLogout() {
    clear();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: tokens.background }}>
      <header
        className="flex flex-wrap items-center justify-between gap-4 p-4"
        style={{ borderBottom: `1px solid ${tokens.border}` }}
      >
        <nav className="flex flex-wrap gap-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ fontSize: 14, fontWeight: 500, color: tokens.textPrimary }}
              className="underline-offset-4 hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <ChildSelector />
          {selectedChildId ? (
            <Link
              href={`/kid/${selectedChildId}`}
              style={{ fontSize: 14, fontWeight: 500, color: tokens.accentText }}
              className="underline-offset-4 hover:underline"
            >
              Экран ребёнка →
            </Link>
          ) : null}
          <Button variant="secondary" onClick={handleLogout}>
            Выйти
          </Button>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}

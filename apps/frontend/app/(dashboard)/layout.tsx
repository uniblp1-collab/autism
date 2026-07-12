"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, useTheme } from "@autism-connect/ui";
import { useAuthStore } from "../../store/authStore";
import { ChildSelector } from "../../shared/ui/ChildSelector";

const NAV_ITEMS = [
  { href: "/children", label: "Дети" },
  { href: "/cards", label: "Карточки" },
  { href: "/schedule", label: "Расписание" },
  { href: "/statistics", label: "Статистика" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { tokens } = useTheme();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);

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
          {user?.role === "ADMIN" ? (
            <Link
              href="/admin/users"
              style={{ fontSize: 14, fontWeight: 500, color: tokens.accentText }}
              className="underline-offset-4 hover:underline"
            >
              Админ-панель
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-4">
          <ChildSelector />
          <Button variant="secondary" onClick={handleLogout}>
            Выйти
          </Button>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}

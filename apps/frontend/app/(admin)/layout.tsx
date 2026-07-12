"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, useTheme } from "@autism-connect/ui";
import { useAuthStore } from "../../store/authStore";

const NAV_ITEMS = [
  { href: "/admin/users", label: "Родители" },
  { href: "/admin/cards", label: "Картинки карточек" },
];

// Клиентская проверка роли — только UX-уровень (мгновенный редирект без мигания
// админ-интерфейса). Настоящая защита — RolesGuard + @Roles("ADMIN") на бэкенде
// (apps/backend/src/modules/admin), эта проверка её не заменяет.
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { tokens } = useTheme();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace("/children");
    }
  }, [user, router]);

  if (!user || user.role !== "ADMIN") return null;

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
        <Button variant="secondary" onClick={handleLogout}>
          Выйти
        </Button>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}

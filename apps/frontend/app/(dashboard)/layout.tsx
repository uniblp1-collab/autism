"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@autism-connect/ui";
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
  const clear = useAuthStore((state) => state.clear);

  function handleLogout() {
    clear();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-gray-200 p-4">
        <nav className="flex flex-wrap gap-4">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium underline-offset-4 hover:underline">
              {item.label}
            </Link>
          ))}
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

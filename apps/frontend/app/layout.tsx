import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
// Шрифты через @fontsource (self-hosted npm-пакет), а не next/font/google — последний
// скачивает файлы с fonts.gstatic.com во время `next build`, что ломает сборку в Docker/CI
// без доступа к интернету на этом шаге; @fontsource кладёт файлы в node_modules при
// установке зависимостей, и сборка их не запрашивает по сети.
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/500.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import { HighContrastThemeProvider } from "@autism-connect/ui";
import { QueryProvider } from "../shared/api/QueryProvider";
import { isDemoMode } from "../shared/api/demoData";
import { PwaRegister } from "../shared/ui/PwaRegister";
import "./globals.css";

// ?v=BUILD_ID — тот же build-id, что и в имени кэша service worker (см. scripts/generate-sw.mjs,
// который версионирует так же src иконок в public/manifest.json). Без него смена файла лого по
// тому же URL не гарантирует обновление значка на домашнем экране: у iOS Safari есть отдельный
// системный кэш touch-иконки, привязанный к URL, а не к содержимому файла — обычное обновление
// страницы его не затрагивает (жалоба «иконка не поменялась» после замены логотипа).
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "";
const appleTouchIconHref = BUILD_ID ? `/icons/apple-touch-icon.png?v=${BUILD_ID}` : "/icons/apple-touch-icon.png";

// В офлайн-демо (TASK_DEMO_OFFLINE.md §6) подключаем PWA-манифест и iOS-метаданные, чтобы
// приложение ставилось на домашний экран планшета в полноэкранном режиме. В обычной серверной
// сборке этих полей нет — isDemoMode вычисляется на этапе сборки.
export const metadata: Metadata = {
  // Название демо-PWA — "Коммуникатор" (TASK_DEMO_ENHANCEMENTS.md §6); основная (не демо)
  // сборка сохраняет "Autism Connect", это переименование касается только офлайн-демо.
  title: isDemoMode ? "Коммуникатор" : "Autism Connect",
  description: "AAC-платформа альтернативной коммуникации для детей с РАС",
  ...(isDemoMode
    ? {
        manifest: "/manifest.json",
        appleWebApp: { capable: true, statusBarStyle: "default" as const, title: "Коммуникатор" },
        icons: { apple: appleTouchIconHref },
      }
    : {}),
};

export const viewport: Viewport = {
  ...(isDemoMode ? { themeColor: "#2F6FED" } : {}),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="font-sans">
        {isDemoMode ? <PwaRegister /> : null}
        <QueryProvider>
          <HighContrastThemeProvider>{children}</HighContrastThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

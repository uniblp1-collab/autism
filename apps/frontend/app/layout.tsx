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

// basePath приходится проставлять ВРУЧНУЮ для manifest и apple-touch-icon: Next.js применяет
// basePath к _next-ассетам и next/link, но НЕ к metadata.manifest и metadata.icons — там строка
// с ведущим "/" уходит в HTML как есть. На GitHub Pages (сайт в подпапке /autism) абсолютные
// "/manifest.json" и "/icons/..." резолвятся от КОРНЯ домена (github.io/manifest.json) и дают
// 404 — из-за этого iOS Safari не находил touch-иконку и при «Добавить на экран Домой» рисовал
// серый квадрат с буквой вместо логотипа (а манифест был недоступен и для Android/Chrome).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
// ?v=BUILD_ID (тот же build-id, что и в имени кэша service worker, см. scripts/generate-sw.mjs) —
// делает URL иконки другим на каждую сборку, чтобы системный кэш touch-иконки iOS Safari (он
// привязан к URL, а не к содержимому файла) перечитал новый логотип, а не отдавал старый.
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "";
const versionQuery = BUILD_ID ? `?v=${BUILD_ID}` : "";
const manifestHref = `${BASE_PATH}/manifest.json`;
const appleTouchIconHref = `${BASE_PATH}/icons/apple-touch-icon.png${versionQuery}`;

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
        manifest: manifestHref,
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

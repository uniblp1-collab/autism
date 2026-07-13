import type { Metadata } from "next";
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
import "./globals.css";

export const metadata: Metadata = {
  title: "Autism Connect",
  description: "AAC-платформа альтернативной коммуникации для детей с РАС",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="font-sans">
        <QueryProvider>
          <HighContrastThemeProvider>{children}</HighContrastThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

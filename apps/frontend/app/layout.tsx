import type { Metadata } from "next";
import { ReactNode } from "react";
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
      <body>
        <QueryProvider>
          <HighContrastThemeProvider>{children}</HighContrastThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

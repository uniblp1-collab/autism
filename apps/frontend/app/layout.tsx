import type { Metadata } from "next";
import { ReactNode } from "react";
import { Nunito, Inter } from "next/font/google";
import { HighContrastThemeProvider } from "@autism-connect/ui";
import { QueryProvider } from "../shared/api/QueryProvider";
import "./globals.css";

// DESIGN.md §2: --font-sans: 'Nunito', 'Inter', system-ui, sans-serif.
// Только 400/500 — Anthropic Sans из рендеров проприетарный и не переносится (см. DESIGN.md §8).
const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-nunito",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Autism Connect",
  description: "AAC-платформа альтернативной коммуникации для детей с РАС",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${nunito.variable} ${inter.variable}`}>
      <body className="font-sans">
        <QueryProvider>
          <HighContrastThemeProvider>{children}</HighContrastThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { ThemeMode, ThemeTokens, themeTokens } from "./tokens";

interface ThemeContextValue {
  mode: ThemeMode;
  tokens: ThemeTokens;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function HighContrastThemeProvider({
  children,
  initialMode = "standard",
}: {
  children: ReactNode;
  initialMode?: ThemeMode;
}) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      tokens: themeTokens[mode],
      toggleMode: () => setMode((current) => (current === "standard" ? "highContrast" : "standard")),
      setMode,
    }),
    [mode],
  );

  const tokens = value.tokens;

  return (
    <ThemeContext.Provider value={value}>
      <div
        data-theme={mode}
        style={{
          backgroundColor: tokens.background,
          color: tokens.textPrimary,
          minHeight: "100%",
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a HighContrastThemeProvider");
  }
  return context;
}

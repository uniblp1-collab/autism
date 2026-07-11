"use client";

import { radiusTokens } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";

export interface MetricCardProps {
  label: string;
  value: string | number;
}

/** Метрическая карточка кабинета родителя — DESIGN.md §6.5. */
export function MetricCard({ label, value }: MetricCardProps) {
  const { tokens } = useTheme();

  return (
    <div
      className="flex flex-col gap-1"
      style={{ backgroundColor: tokens.surface, borderRadius: radiusTokens.md, padding: 16 }}
    >
      <span style={{ fontSize: 13, fontWeight: 400, color: tokens.textSecondary }}>{label}</span>
      <span style={{ fontSize: 24, fontWeight: 500, color: tokens.textPrimary }}>{value}</span>
    </div>
  );
}

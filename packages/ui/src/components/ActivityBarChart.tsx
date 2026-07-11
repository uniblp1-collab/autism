"use client";

import { useTheme } from "../theme/HighContrastThemeProvider";

export interface ActivityBarChartDatum {
  label: string;
  value: number;
}

export interface ActivityBarChartProps {
  data: ActivityBarChartDatum[];
}

const BAR_AREA_HEIGHT = 140;

/** Столбчатый график активности по дням — DESIGN.md §6.6. Единственный акцент — день-максимум. */
export function ActivityBarChart({ data }: ActivityBarChartProps) {
  const { tokens } = useTheme();
  const maxValue = Math.max(0, ...data.map((d) => d.value));

  return (
    <div className="flex items-stretch gap-2" style={{ height: BAR_AREA_HEIGHT + 24 }}>
      {data.map((day) => {
        const isMax = day.value === maxValue && maxValue > 0;
        const barHeight = Math.max(4, (day.value / Math.max(1, maxValue)) * BAR_AREA_HEIGHT);
        return (
          <div key={day.label} className="flex flex-1 flex-col items-center justify-end gap-2">
            <div
              className="w-full"
              style={{
                height: barHeight,
                backgroundColor: isMax ? tokens.accent : tokens.accentSoft,
                borderRadius: 6,
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 400, color: tokens.textMuted }}>{day.label}</span>
          </div>
        );
      })}
    </div>
  );
}

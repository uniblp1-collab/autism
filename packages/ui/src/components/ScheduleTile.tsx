"use client";

import { IconCheck } from "@tabler/icons-react";
import { radiusTokens, paddingTokens } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";
import { Icon } from "./Icon";

export type ScheduleTileState = "done" | "current" | "upcoming";

export interface ScheduleTileProps {
  title: string;
  icon?: string;
  state: ScheduleTileState;
  onClick?: () => void;
}

/** Плитка шага расписания — три состояния той же геометрии (DESIGN.md §6.4). */
export function ScheduleTile({ title, icon, state, onClick }: ScheduleTileProps) {
  const { tokens } = useTheme();

  const stateStyle =
    state === "done"
      ? { backgroundColor: tokens.success, color: tokens.successText, border: "none" }
      : state === "current"
        ? { backgroundColor: tokens.accentSoft, color: tokens.accentText, border: `2px solid ${tokens.accentBorder}` }
        : { backgroundColor: tokens.surfaceMuted, color: tokens.textMuted, border: "none" };

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex shrink-0 flex-col items-center justify-center gap-2"
      style={{
        width: 132,
        minHeight: 96,
        borderRadius: radiusTokens.md,
        padding: paddingTokens.tile,
        ...stateStyle,
      }}
    >
      {state === "done" ? (
        <span className="absolute right-2 top-2">
          <IconCheck size={16} stroke={2.5} aria-hidden="true" />
        </span>
      ) : null}
      {icon ? <Icon name={icon} size={28} /> : null}
      <span className="text-center" style={{ fontSize: 14, fontWeight: 500 }}>
        {title}
      </span>
    </button>
  );
}

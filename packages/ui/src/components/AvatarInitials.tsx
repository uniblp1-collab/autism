"use client";

import { useTheme } from "../theme/HighContrastThemeProvider";

export interface AvatarInitialsProps {
  name: string;
  size?: number;
}

function initialsOf(name: string): string {
  return name.trim().slice(0, 1).toUpperCase();
}

/** Аватар-инициалы карточки ребёнка — DESIGN.md §6.7. */
export function AvatarInitials({ name, size = 40 }: AvatarInitialsProps) {
  const { tokens } = useTheme();

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: tokens.accentSoft,
        color: tokens.accentText,
        fontSize: 14,
        fontWeight: 500,
      }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

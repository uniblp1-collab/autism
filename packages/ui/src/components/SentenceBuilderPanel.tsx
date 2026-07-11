"use client";

import { IconVolume } from "@tabler/icons-react";
import { radiusTokens } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";

export interface SentenceBuilderWord {
  id: string;
  title: string;
}

export interface SentenceBuilderPanelProps {
  words: SentenceBuilderWord[];
  onRemoveWord: (index: number) => void;
  onSpeak: () => void;
  speakLabel?: string;
}

/** Панель конструктора предложения — DESIGN.md §6.1. */
export function SentenceBuilderPanel({ words, onRemoveWord, onSpeak, speakLabel = "Озвучить" }: SentenceBuilderPanelProps) {
  const { tokens } = useTheme();

  return (
    <div
      className="flex items-center gap-3"
      style={{ backgroundColor: tokens.surfaceMuted, borderRadius: radiusTokens.lg, padding: 20 }}
    >
      <div className="flex flex-1 flex-wrap gap-2 overflow-x-auto">
        {words.map((word, index) => (
          <button
            key={`${word.id}-${index}`}
            type="button"
            onClick={() => onRemoveWord(index)}
            className="shrink-0 px-3 py-2"
            style={{
              backgroundColor: tokens.accentSoft,
              color: tokens.accentText,
              borderRadius: radiusTokens.sm,
              fontSize: 16,
              fontWeight: 400,
            }}
          >
            {word.title}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onSpeak}
        disabled={words.length === 0}
        className="flex shrink-0 items-center gap-2 px-5 py-3 disabled:opacity-40"
        style={{
          backgroundColor: tokens.accent,
          color: "#FFFFFF",
          borderRadius: radiusTokens.sm,
          fontSize: 16,
          fontWeight: 500,
        }}
      >
        <IconVolume size={20} stroke={2} aria-hidden="true" />
        {speakLabel}
      </button>
    </div>
  );
}

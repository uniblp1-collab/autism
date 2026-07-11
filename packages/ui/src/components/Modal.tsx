"use client";

import { ReactNode } from "react";
import { radiusTokens } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const { tokens } = useTheme();
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6"
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: radiusTokens.lg,
          color: tokens.textPrimary,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 style={{ fontSize: 18, fontWeight: 500 }}>{title}</h2>
          <button
            type="button"
            aria-label="Закрыть"
            className="px-2 py-1 focus:outline-none focus-visible:ring-2"
            style={{ color: tokens.textSecondary, fontSize: 14, borderRadius: radiusTokens.sm }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

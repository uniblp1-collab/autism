"use client";

import { ReactNode } from "react";
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
        className="w-full max-w-md rounded-2xl border-2 p-6 shadow-xl"
        style={{ backgroundColor: tokens.background, borderColor: tokens.border, color: tokens.textPrimary }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Закрыть"
            className="rounded-md px-2 py-1 text-sm focus:outline-none focus-visible:ring-2"
            style={{ color: tokens.textSecondary }}
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

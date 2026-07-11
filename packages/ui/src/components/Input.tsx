"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";
import { radiusTokens } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, style, ...rest }, ref) => {
    const { tokens } = useTheme();
    const inputId = id ?? rest.name;

    return (
      <div className="flex flex-col gap-1">
        {label ? (
          <label htmlFor={inputId} style={{ color: tokens.textPrimary, fontSize: 14, fontWeight: 500 }}>
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={clsx("px-3 py-2 focus:outline-none focus-visible:ring-2", className)}
          style={{
            backgroundColor: tokens.surface,
            color: tokens.textPrimary,
            border: `1px solid ${error ? tokens.danger : tokens.border}`,
            borderRadius: radiusTokens.sm,
            fontSize: 14,
            fontWeight: 400,
            // @ts-expect-error CSS custom property for focus ring color
            "--tw-ring-color": tokens.focusRing,
            ...style,
          }}
          {...rest}
        />
        {error ? (
          <span style={{ fontSize: 12, fontWeight: 400, color: tokens.danger }}>{error}</span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

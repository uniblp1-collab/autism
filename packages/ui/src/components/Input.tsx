"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";
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
          <label htmlFor={inputId} className="text-sm font-medium" style={{ color: tokens.textPrimary }}>
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "rounded-lg border-2 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2",
            className,
          )}
          style={{
            backgroundColor: tokens.background,
            color: tokens.textPrimary,
            borderColor: error ? tokens.danger : tokens.border,
            // @ts-expect-error CSS custom property for focus ring color
            "--tw-ring-color": tokens.focusRing,
            ...style,
          }}
          {...rest}
        />
        {error ? (
          <span className="text-xs" style={{ color: tokens.danger }}>
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

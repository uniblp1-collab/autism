"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { radiusTokens } from "../theme/tokens";
import { useTheme } from "../theme/HighContrastThemeProvider";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, style, ...rest }, ref) => {
    const { tokens } = useTheme();

    const palette: Record<NonNullable<ButtonProps["variant"]>, { bg: string; fg: string; border: string }> = {
      primary: { bg: tokens.accent, fg: "#FFFFFF", border: tokens.accent },
      secondary: { bg: tokens.surface, fg: tokens.textPrimary, border: tokens.border },
      danger: { bg: tokens.danger, fg: "#FFFFFF", border: tokens.danger },
    };
    const colors = palette[variant];

    return (
      <button
        ref={ref}
        className={clsx(
          "px-4 py-2 transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        style={{
          backgroundColor: colors.bg,
          color: colors.fg,
          border: `1px solid ${colors.border}`,
          borderRadius: radiusTokens.sm,
          fontSize: 14,
          fontWeight: 500,
          // @ts-expect-error CSS custom property for focus ring color
          "--tw-ring-color": tokens.focusRing,
          ...style,
        }}
        {...rest}
      />
    );
  },
);

Button.displayName = "Button";

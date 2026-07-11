import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./entities/**/*.{ts,tsx}",
    "./shared/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-nunito)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontWeight: {
        // DESIGN.md §1: только два начертания во всём приложении.
        normal: "400",
        medium: "500",
        semibold: "500",
        bold: "500",
      },
      borderRadius: {
        sm: "10px",
        md: "14px",
        lg: "16px",
      },
    },
  },
  plugins: [],
};

export default config;

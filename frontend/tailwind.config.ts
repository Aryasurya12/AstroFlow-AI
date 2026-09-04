import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--bg-base))",
        foreground: "hsl(var(--fg-base))",
        surface: {
          DEFAULT: "hsl(var(--bg-surface))",
          elevated: "hsl(var(--bg-elevated))",
        },
        primary: "hsl(var(--accent-primary))",
        accent: {
          DEFAULT: "hsl(var(--accent-primary))",
          hover: "hsl(var(--accent-hover))",
          muted: "hsl(var(--accent-muted))",
        },
        status: {
          nominal: "hsl(var(--status-nominal))",
          warning: "hsl(var(--status-warning))",
          critical: "hsl(var(--status-critical))",
          muted: "hsl(var(--status-muted))",
        },
        border: "hsl(var(--border-color))",
        muted: {
          DEFAULT: "hsl(var(--status-muted))",
          foreground: "hsl(var(--fg-muted))",
        },
      },
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "4px",
        md: "4px",
        lg: "4px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        "glow-cyan": "0 0 12px -2px hsla(185, 80%, 45%, 0.35)",
        "glow-red": "0 0 12px -2px hsla(0, 90%, 50%, 0.45)",
        "glow-amber": "0 0 12px -2px hsla(38, 90%, 50%, 0.35)",
        "glow-green": "0 0 12px -2px hsla(145, 60%, 40%, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;

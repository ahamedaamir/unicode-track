import type { Config } from "tailwindcss";

/**
 * UniCodeTrack AI — Student Dashboard Design Tokens
 * Strict 3-Color Palette:
 * 1. Primary: Indigo (#4F46E5, #EEF2FF, #4338CA)
 * 2. Accent (AI Only): Cyan (#06B6D4, #ECFEFF)
 * 3. Neutral: Slate (Light & Dark modes)
 */
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
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          soft: "var(--primary-soft)",
          foreground: "var(--primary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          border: "var(--accent-border)",
          foreground: "var(--accent-foreground)",
        },
        neutral: {
          bg: "var(--neutral-bg)",
          card: "var(--neutral-card)",
          surface: "var(--neutral-surface)",
          border: "var(--neutral-border)",
          muted: "var(--neutral-muted)",
          text: "var(--neutral-text)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-jakarta)",
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};

export default config;

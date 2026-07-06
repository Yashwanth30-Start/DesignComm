import type { Config } from "tailwindcss";

// Design tokens ported from the legacy commissionos-fixed.html dark-glass-neon
// language, extended with gold + refined white per the V1 palette spec.
// Keep these in sync with the CSS custom properties in app/globals.css.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        void: "#05070A",
        bg: {
          DEFAULT: "#0E1113",
          2: "#151A1C",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.045)",
          hi: "rgba(255,255,255,0.07)",
          border: "rgba(255,255,255,0.09)",
          "border-hi": "rgba(255,255,255,0.16)",
        },
        ink: {
          DEFAULT: "#EDF2F3",
          dim: "#8E9A9D",
          dim2: "#5C6669",
        },
        cyan: { DEFAULT: "#6FE3F2", soft: "rgba(111,227,242,0.14)" },
        emerald: { DEFAULT: "#2ECC71", soft: "rgba(46,204,113,0.14)" },
        amber: { DEFAULT: "#FFB86B", soft: "rgba(255,184,107,0.14)" },
        gold: { DEFAULT: "#E8C468", soft: "rgba(232,196,104,0.14)" },
        purple: { DEFAULT: "#B8A7FF", soft: "rgba(184,167,255,0.14)" },
        security: { DEFAULT: "#A855F7", soft: "rgba(168,85,247,0.14)" },
        red: { DEFAULT: "#EF4444", soft: "rgba(239,68,68,0.14)" },
        status: {
          ready: "#2ECC71",
          waiting: "#E8C468",
          blocked: "#EF4444",
          commissioned: "#6FE3F2",
          complete: "#F7FAFB",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "22px",
      },
      boxShadow: {
        glass: "0 20px 70px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        "glow-cyan": "0 0 32px rgba(111,227,242,0.25)",
        "glow-emerald": "0 0 32px rgba(46,204,113,0.22)",
        "glow-purple": "0 0 32px rgba(184,167,255,0.24)",
        "glow-gold": "0 0 32px rgba(232,196,104,0.22)",
        "glow-red": "0 0 32px rgba(239,68,68,0.22)",
      },
      backdropBlur: {
        xs: "6px",
      },
      transitionTimingFunction: {
        cinematic: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        400: "400ms",
        600: "600ms",
        900: "900ms",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(180deg,#030407 0%,#090D12 42%,#040507 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

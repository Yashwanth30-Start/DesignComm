import type { Config } from "tailwindcss";

// Continuation of the validated CommissionOS dark-glass-neon language
// (see web/docs/design-system.md) so EngineerOS feels like the same family.
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#05070A",
        bg: "#0E1113",
        "bg-2": "#151A1C",
        glass: "rgba(255,255,255,0.045)",
        "glass-hi": "rgba(255,255,255,0.07)",
        ink: "#EDF2F3",
        "ink-dim": "#8E9A9D",
        "ink-dim2": "#5C6669",
        cyan: "#6FE3F2",
        emerald: "#2ECC71",
        amber: "#FFB86B",
        gold: "#E8C468",
        purple: "#B8A7FF",
        red: "#EF4444"
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"]
      },
      boxShadow: {
        glow: "0 0 24px rgba(111,227,242,0.18)",
        "glow-sm": "0 0 12px rgba(111,227,242,0.12)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";

/**
 * Semantic colors map to CSS variables defined in globals.css so the whole
 * palette flips between light and dark by toggling the `.dark` class.
 */
const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-elev": "var(--bg-elev)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        "text-subtle": "var(--text-subtle)",
        primary: "var(--primary)",
        "primary-fg": "var(--primary-fg)",
        navy: "var(--brand-navy)",
        gold: "var(--brand-gold)",
        success: "var(--success)",
        danger: "var(--danger)",
        info: "var(--info)",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        ctl: "10px",
        modal: "20px",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(226,59,50,0.45)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 30px rgba(0,0,0,0.35)",
        "card-light": "0 1px 2px rgba(20,20,40,0.06), 0 8px 24px rgba(20,20,40,0.06)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-12px) scale(1.04)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        float: "float 9s ease-in-out infinite",
        "pop-in": "pop-in 0.2s cubic-bezier(0.22,1,0.36,1)",
      },
    },
  },
  plugins: [],
};

export default config;

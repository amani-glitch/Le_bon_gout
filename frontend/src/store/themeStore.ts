import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

function apply(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (theme) => {
        apply(theme);
        set({ theme });
      },
      toggle: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        apply(next);
        set({ theme: next });
      },
    }),
    {
      name: "lebongout-theme",
      // Persist only the bare string to match the pre-paint inline script.
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name);
          return value ? { state: { theme: value as Theme }, version: 0 } : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, value.state.theme);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);

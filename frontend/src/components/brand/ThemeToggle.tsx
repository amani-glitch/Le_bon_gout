import { Moon, Sun } from "lucide-react";

import { useThemeStore } from "@/store/themeStore";

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-ctl border border-border text-text-muted transition-colors hover:bg-surface-2 hover:text-text focus-ring"
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

import { Outlet } from "react-router-dom";

import { GlowBackground } from "@/components/brand/GlowBackground";
import { LangToggle } from "@/components/brand/LangToggle";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";

export function PublicLayout() {
  return (
    <div className="relative min-h-screen">
      <GlowBackground />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

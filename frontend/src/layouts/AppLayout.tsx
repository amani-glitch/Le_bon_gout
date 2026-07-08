import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { GlowBackground } from "@/components/brand/GlowBackground";
import { LangToggle } from "@/components/brand/LangToggle";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { useAuth } from "@/features/auth/useAuth";
import { BotWidget } from "@/features/bot/BotWidget";
import { useCart } from "@/features/cart/cartApi";
import { CartDrawer } from "@/features/cart/CartDrawer";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/store/uiStore";

import { AccountMenu } from "./AccountMenu";

function CartButton() {
  const t = useT();
  const { isAuthenticated } = useAuth();
  const { data: cart } = useCart(isAuthenticated);
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const count = cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0;
  return (
    <button
      onClick={() => setCartOpen(true)}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-ctl border border-border text-text-muted transition-colors hover:bg-surface-2 hover:text-text focus-ring"
      aria-label={t.app.cartAria}
    >
      <ShoppingBag className="h-[18px] w-[18px]" />
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-fg"
        >
          {count}
        </motion.span>
      )}
    </button>
  );
}

export function AppLayout() {
  const t = useT();
  const navLinks = [
    { to: "/menu", label: t.app.nav.menu },
    { to: "/favorites", label: t.app.nav.favorites },
    { to: "/orders", label: t.app.nav.orders },
  ];
  return (
    <div className="relative min-h-screen">
      <GlowBackground />
      <header className="sticky top-0 z-40 border-b border-border bg-bg-elev/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "relative rounded-ctl px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive ? "text-text" : "text-text-muted hover:text-text",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-full bg-primary"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <CartButton />
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-6 py-8 text-center text-sm text-text-muted">
          <Logo withText={false} />
          <p className="mt-2">{t.app.footer.tagline}</p>
          <p className="text-xs text-text-subtle">{t.app.footer.rights}</p>
        </div>
      </footer>

      <CartDrawer />
      <BotWidget />
    </div>
  );
}

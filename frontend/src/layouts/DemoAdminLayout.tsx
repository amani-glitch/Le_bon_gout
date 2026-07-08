import {
  Inbox,
  LayoutDashboard,
  MessagesSquare,
  Package,
  Receipt,
  Users,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { LangToggle } from "@/components/brand/LangToggle";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { DemoProvider } from "@/features/admin/demo/demoContext";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";

export function DemoAdminLayout() {
  const t = useT();

  const links = [
    { to: "/demo/admin", label: t.admin.nav.dashboard, icon: LayoutDashboard, end: true },
    { to: "/demo/admin/orders", label: t.admin.nav.orders, icon: Receipt },
    { to: "/demo/admin/products", label: t.admin.nav.products, icon: Package },
    { to: "/demo/admin/customers", label: t.admin.nav.customers, icon: Users },
    { to: "/demo/admin/conversations", label: t.admin.nav.concierge, icon: MessagesSquare },
    { to: "/demo/admin/leads", label: t.admin.nav.leads, icon: Inbox },
  ];

  return (
    <DemoProvider>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-navy text-white dark:bg-transparent md:flex">
          <div className="px-5 py-5">
            <Logo to="/" />
            <span className="mt-3 inline-block rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              {t.demo.badge}
            </span>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-ctl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("h-[18px] w-[18px]", isActive && "text-primary")} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-2 border-t border-white/10 p-3">
            <Button asChild size="sm" className="w-full justify-center">
              <a href="/#contact">{t.demo.bookDemo}</a>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full justify-center text-white/70 hover:bg-white/5 hover:text-white"
            >
              <a href="/">{t.demo.backToSite}</a>
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Preview banner */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-primary/30 bg-primary/10 px-6 py-2 text-center text-sm text-text">
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary-fg">
              {t.demo.badge}
            </span>
            <span className="text-text-muted">{t.demo.banner}</span>
            <a href="/#contact" className="font-semibold text-primary hover:underline">
              {t.demo.bookDemo}
            </a>
          </div>
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg-elev/90 px-6 py-3 backdrop-blur-xl">
            <span className="font-display text-lg">{t.admin.heading}</span>
            <div className="flex items-center gap-3">
              <LangToggle />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 px-6 py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </DemoProvider>
  );
}

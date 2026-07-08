import {
  Inbox,
  LayoutDashboard,
  MessagesSquare,
  Package,
  Receipt,
  Store,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { LangToggle } from "@/components/brand/LangToggle";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/useAuth";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";

export function AdminLayout() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const links = [
    { to: "/admin", label: t.admin.nav.dashboard, icon: LayoutDashboard, end: true },
    { to: "/admin/orders", label: t.admin.nav.orders, icon: Receipt },
    { to: "/admin/products", label: t.admin.nav.products, icon: Package },
    { to: "/admin/customers", label: t.admin.nav.customers, icon: Users },
    { to: "/admin/conversations", label: t.admin.nav.concierge, icon: MessagesSquare },
    { to: "/admin/leads", label: t.admin.nav.leads, icon: Inbox },
  ];
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-navy text-white dark:bg-transparent md:flex">
        <div className="px-5 py-5">
          <Logo />
          <span className="mt-3 inline-block rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
            {t.admin.staff}
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
        <div className="border-t border-white/10 p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/70 hover:bg-white/5 hover:text-white"
            onClick={() => navigate("/menu")}
          >
            <Store className="h-4 w-4" /> {t.admin.backToStore}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg-elev/90 px-6 py-3 backdrop-blur-xl">
          <span className="font-display text-lg">{t.admin.heading}</span>
          <div className="flex items-center gap-3">
            <LangToggle />
            <ThemeToggle />
            <span className="hidden text-sm text-text-muted sm:block">{user?.email}</span>
          </div>
        </header>
        <main className="flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

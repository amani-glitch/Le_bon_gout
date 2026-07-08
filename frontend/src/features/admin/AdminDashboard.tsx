import { Receipt, TrendingUp, Users, Utensils } from "lucide-react";

import { Skeleton } from "@/components/brand/Skeleton";
import { useStatusLabel, useT } from "@/i18n/useT";
import { formatMoney } from "@/lib/format";

import { useMetrics } from "./adminApi";

export function AdminDashboard() {
  const t = useT();
  const statusLabel = useStatusLabel();
  const { data, isLoading } = useMetrics();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: t.admin.dashboard.ordersToday,
      value: data.orders_today.toString(),
      icon: Receipt,
    },
    {
      label: t.admin.dashboard.revenueToday,
      value: formatMoney(data.revenue_today_cents),
      icon: TrendingUp,
    },
    {
      label: t.admin.dashboard.activeOrders,
      value: data.active_orders.toString(),
      icon: Utensils,
    },
    {
      label: t.admin.dashboard.customers,
      value: data.total_customers.toString(),
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">{t.admin.dashboard.title}</h1>
        <p className="text-text-muted">{t.admin.dashboard.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-card border border-border bg-surface p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-ctl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <p className="font-display text-3xl tnum">{value}</p>
            <p className="text-sm text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-6">
          <h2 className="mb-4 font-display text-lg">{t.admin.dashboard.ordersByStatus}</h2>
          {data.orders_by_status.length === 0 ? (
            <p className="text-sm text-text-muted">{t.admin.dashboard.noOrders}</p>
          ) : (
            <ul className="space-y-2">
              {data.orders_by_status.map((s) => (
                <li key={s.status} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{statusLabel(s.status)}</span>
                  <span className="font-medium tnum">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-card border border-border bg-surface p-6">
          <h2 className="mb-4 font-display text-lg">{t.admin.dashboard.topProducts}</h2>
          {data.top_products.length === 0 ? (
            <p className="text-sm text-text-muted">{t.admin.dashboard.noSales}</p>
          ) : (
            <ul className="space-y-2">
              {data.top_products.map((p) => (
                <li key={p.product_id} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{p.name}</span>
                  <span className="font-medium tnum">{p.quantity} {t.admin.dashboard.sold}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-6">
        <p className="text-sm text-text-muted">
          {t.admin.dashboard.totalRevenue}{" "}
          <span className="font-display text-xl text-primary tnum">
            {formatMoney(data.revenue_total_cents)}
          </span>{" "}
          {t.admin.dashboard.across} {data.total_orders} {t.admin.dashboard.ordersWord}
        </p>
      </div>
    </div>
  );
}

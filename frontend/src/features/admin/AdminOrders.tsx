import { useState } from "react";

import { EmptyState } from "@/components/brand/EmptyState";
import { Skeleton } from "@/components/brand/Skeleton";
import { OrderStatusBadge } from "@/features/orders/OrderStatusBadge";
import { useStatusLabel, useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";
import { formatDate, formatMoney } from "@/lib/format";
import type { OrderStatus } from "@/types/api";

import { useAdminOrders, useUpdateOrderStatus } from "./adminApi";

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
];

export function AdminOrders() {
  const t = useT();
  const statusLabel = useStatusLabel();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data, isLoading } = useAdminOrders(filter);
  const updateStatus = useUpdateOrderStatus();

  const FILTERS: { label: string; value?: string }[] = [
    { label: t.admin.orders.filters.all, value: undefined },
    { label: t.admin.orders.filters.pending, value: "pending" },
    { label: t.admin.orders.filters.preparing, value: "preparing" },
    { label: t.admin.orders.filters.outForDelivery, value: "out_for_delivery" },
    { label: t.admin.orders.filters.completed, value: "completed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">{t.admin.orders.title}</h1>
        <p className="text-text-muted">{t.admin.orders.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f.value
                ? "border-primary/40 bg-primary/10 text-text"
                : "border-border text-text-muted hover:text-text",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : data && data.items.length > 0 ? (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t.admin.orders.colOrder}</th>
                <th className="px-4 py-3 font-medium">{t.admin.orders.colCustomer}</th>
                <th className="px-4 py-3 font-medium">{t.admin.orders.colTotal}</th>
                <th className="px-4 py-3 font-medium">{t.admin.orders.colPayment}</th>
                <th className="px-4 py-3 font-medium">{t.admin.orders.colStatus}</th>
                <th className="px-4 py-3 font-medium">{t.admin.orders.colAdvance}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">#{order.id.replace("ord_", "").slice(0, 8)}</p>
                    <p className="text-xs text-text-subtle">{formatDate(order.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="truncate">{order.customer_name}</p>
                    <p className="text-xs text-text-subtle">{order.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 tnum">{formatMoney(order.total_cents)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs font-medium capitalize",
                        order.payment.status === "paid" ? "text-success" : "text-text-muted",
                      )}
                    >
                      {order.payment.method === "online" ? t.admin.orders.card : t.admin.orders.cash} ·{" "}
                      {order.payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      disabled={updateStatus.isPending}
                      onChange={(e) =>
                        updateStatus.mutate({
                          orderId: order.id,
                          status: e.target.value as OrderStatus,
                          paymentStatus:
                            e.target.value === "delivered" &&
                            order.payment.method === "cash_on_delivery"
                              ? "paid"
                              : undefined,
                        })
                      }
                      className="rounded-ctl border border-border bg-surface-2 px-2 py-1.5 text-sm focus-ring"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={t.admin.orders.emptyTitle}
          description={t.admin.orders.emptyDescription}
        />
      )}
    </div>
  );
}

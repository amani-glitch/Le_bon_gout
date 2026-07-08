import { Receipt } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/brand/EmptyState";
import { Skeleton } from "@/components/brand/Skeleton";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";
import { formatDate, formatMoney } from "@/lib/format";
import type { Order } from "@/types/api";

import { OrderStatusBadge } from "./OrderStatusBadge";
import { useOrders } from "./ordersApi";

export function OrdersPage() {
  const t = useT();
  const { data, isLoading } = useOrders();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-3xl">{t.orders.title}</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-4">
          {data.items.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Receipt className="h-6 w-6" />}
          title={t.orders.emptyTitle}
          description={t.orders.emptyDescription}
          action={
            <Button asChild>
              <Link to="/menu">{t.orders.browseMenu}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const t = useT();
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <Link
      to={`/orders/${order.id}`}
      className="block rounded-card border border-border bg-surface p-5 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            {itemCount} {itemCount !== 1 ? t.orders.itemMany : t.orders.itemOne} ·{" "}
            <span className="tnum">{formatMoney(order.total_cents)}</span>
          </p>
          <p className="mt-0.5 text-sm text-text-muted">{formatDate(order.created_at)}</p>
          <p className="mt-1 truncate text-sm text-text-subtle">
            {order.items.map((i) => i.name).join(", ")}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
    </Link>
  );
}

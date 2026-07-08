import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Skeleton } from "@/components/brand/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";
import { formatDate, formatMoney } from "@/lib/format";

import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import { useCancelOrder, useOrder } from "./ordersApi";

export function OrderTrackingPage() {
  const t = useT();
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(orderId);
  const cancel = useCancelOrder();

  if (isLoading) return <Skeleton className="mx-auto h-96 max-w-2xl" />;
  if (!order) return <p className="text-text-muted">{t.orders.notFound}</p>;

  const paymentTone =
    order.payment.status === "paid"
      ? "success"
      : order.payment.status === "failed"
        ? "danger"
        : "neutral";

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/orders")}>
        <ArrowLeft className="h-4 w-4" /> {t.orders.allOrders}
      </Button>

      <div className="rounded-card border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-text-subtle">{t.orders.order}</p>
            <h1 className="font-display text-2xl">#{order.id.replace("ord_", "").slice(0, 10)}</h1>
            <p className="mt-1 text-sm text-text-muted">{formatDate(order.created_at)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="my-6 h-px bg-border" />
        <OrderStatusTimeline status={order.status} fulfillment={order.fulfillment.type} />

        {order.status === "pending" && (
          <Button
            variant="outline"
            size="sm"
            className="mt-6"
            loading={cancel.isPending}
            onClick={() => cancel.mutate(order.id)}
          >
            {t.orders.cancelOrder}
          </Button>
        )}
      </div>

      <div className="mt-5 rounded-card border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg">{t.orders.summary}</h2>
          <Badge tone={paymentTone}>
            {order.payment.method === "online" ? t.orders.card : t.orders.cash} ·{" "}
            {order.payment.status}
          </Badge>
        </div>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.line_id} className="flex justify-between gap-3 text-sm">
              <span>
                <span className="text-text-muted">{item.quantity}×</span> {item.name}
                <span className="text-text-subtle"> · {item.size_name}</span>
                {item.toppings.length > 0 && (
                  <span className="block text-xs text-text-subtle">
                    {item.toppings.map((t) => t.name).join(", ")}
                  </span>
                )}
              </span>
              <span className="tnum">{formatMoney(item.line_total_cents)}</span>
            </li>
          ))}
        </ul>
        <div className="my-4 h-px bg-border" />
        <div className="space-y-1.5 text-sm">
          <Row label={t.orders.subtotal} value={formatMoney(order.subtotal_cents)} />
          {order.delivery_fee_cents > 0 && (
            <Row label={t.orders.delivery} value={formatMoney(order.delivery_fee_cents)} />
          )}
          <div className="flex justify-between pt-1 font-display text-lg">
            <span>{t.orders.total}</span>
            <span className="tnum text-primary">{formatMoney(order.total_cents)}</span>
          </div>
        </div>

        {order.fulfillment.address && (
          <p className="mt-4 text-sm text-text-muted">
            {t.orders.deliveringTo} {order.fulfillment.address.line1}, {order.fulfillment.address.city}{" "}
            {order.fulfillment.address.postcode}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-text-muted">
      <span>{label}</span>
      <span className="tnum">{value}</span>
    </div>
  );
}

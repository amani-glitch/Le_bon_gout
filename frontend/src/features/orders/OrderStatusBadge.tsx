import { Badge } from "@/components/ui/Badge";
import { useStatusLabel } from "@/i18n/useT";
import type { OrderStatus } from "@/types/api";

const tone: Record<OrderStatus, "neutral" | "gold" | "success" | "danger" | "info"> = {
  pending: "gold",
  confirmed: "info",
  preparing: "gold",
  ready: "info",
  out_for_delivery: "info",
  delivered: "success",
  completed: "success",
  cancelled: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const statusLabel = useStatusLabel();
  return <Badge tone={tone[status]}>{statusLabel(status)}</Badge>;
}

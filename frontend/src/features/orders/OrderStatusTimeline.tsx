import { Check } from "lucide-react";

import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";
import type { FulfillmentType, OrderStatus } from "@/types/api";

export function OrderStatusTimeline({
  status,
  fulfillment,
}: {
  status: OrderStatus;
  fulfillment: FulfillmentType;
}) {
  const t = useT();

  if (status === "cancelled") {
    return (
      <div className="rounded-card border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
        {t.timeline.cancelledNotice}
      </div>
    );
  }

  const deliverySteps: { status: OrderStatus; label: string }[] = [
    { status: "pending", label: t.timeline.received },
    { status: "confirmed", label: t.timeline.confirmed },
    { status: "preparing", label: t.timeline.inTheOven },
    { status: "out_for_delivery", label: t.timeline.outForDelivery },
    { status: "delivered", label: t.timeline.delivered },
  ];

  const pickupSteps: { status: OrderStatus; label: string }[] = [
    { status: "pending", label: t.timeline.received },
    { status: "confirmed", label: t.timeline.confirmed },
    { status: "preparing", label: t.timeline.inTheOven },
    { status: "ready", label: t.timeline.readyForPickup },
    { status: "completed", label: t.timeline.collected },
  ];

  const steps = fulfillment === "pickup" ? pickupSteps : deliverySteps;
  const currentIndex = Math.max(
    steps.findIndex((s) => s.status === status),
    status === "completed" ? steps.length - 1 : 0,
  );

  return (
    <ol className="relative space-y-6 pl-2">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step.status} className="relative flex items-center gap-4">
            <div className="relative">
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "absolute left-1/2 top-7 h-6 w-0.5 -translate-x-1/2",
                    done ? "bg-primary" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-primary bg-primary text-primary-fg",
                  active && "border-primary text-primary",
                  !done && !active && "border-border text-text-subtle",
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : active ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-current" />
                )}
              </span>
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                active ? "text-text" : done ? "text-text-muted" : "text-text-subtle",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

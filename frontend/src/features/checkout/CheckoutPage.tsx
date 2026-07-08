import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "@/components/brand/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/useAuth";
import { useCart, useClearCart } from "@/features/cart/cartApi";
import { useProfile } from "@/features/profile/profileApi";
import { useT } from "@/i18n/useT";
import { apiErrorMessage } from "@/lib/apiClient";
import { cn } from "@/lib/cn";
import { stripeEnabled } from "@/app/config/env";
import { formatMoney } from "@/lib/format";
import type { FulfillmentType, PaymentMethod } from "@/types/api";

import { useCreateOrder } from "./checkoutApi";
import { StripePaymentSection } from "./StripePaymentSection";

const DELIVERY_FEE = 299;

export function CheckoutPage() {
  const t = useT();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: cart } = useCart(isAuthenticated);
  const { data: profile } = useProfile();
  const createOrder = useCreateOrder();
  const clearCart = useClearCart();

  const [fulfillment, setFulfillment] = useState<FulfillmentType>("delivery");
  const [method, setMethod] = useState<PaymentMethod>(
    stripeEnabled ? "online" : "cash_on_delivery",
  );
  const [form, setForm] = useState({
    line1: "",
    line2: "",
    city: "",
    postcode: "",
    phone: "",
  });
  const [notes, setNotes] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Prefill from the default saved address.
  useEffect(() => {
    const def = profile?.addresses.find((a) => a.is_default) ?? profile?.addresses[0];
    if (def) {
      setForm({
        line1: def.line1,
        line2: def.line2 ?? "",
        city: def.city,
        postcode: def.postcode,
        phone: def.phone ?? profile?.phone ?? "",
      });
    }
  }, [profile]);

  const subtotal = cart?.subtotal_cents ?? 0;
  const deliveryFee = fulfillment === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const amountLabel = useMemo(() => formatMoney(total), [total]);

  if (cart && cart.items.length === 0 && !pendingOrderId) {
    return (
      <EmptyState
        title={t.checkout.emptyTitle}
        description={t.checkout.emptyDescription}
        action={<Button onClick={() => navigate("/menu")}>{t.checkout.browseMenu}</Button>}
      />
    );
  }

  function placeOrder() {
    if (fulfillment === "delivery" && (!form.line1 || !form.city || !form.postcode)) {
      toast.error(t.checkout.addressError);
      return;
    }
    createOrder.mutate(
      {
        payment_method: method,
        fulfillment_type: fulfillment,
        address:
          fulfillment === "delivery"
            ? {
                id: "addr_checkout",
                label: "Delivery",
                line1: form.line1,
                line2: form.line2 || null,
                city: form.city,
                postcode: form.postcode,
                phone: form.phone || null,
                is_default: false,
              }
            : null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: (res) => {
          if (method === "online" && res.client_secret) {
            setClientSecret(res.client_secret);
            setPendingOrderId(res.order.id);
          } else {
            clearCart.mutate();
            navigate(`/order/confirmation/${res.order.id}`);
          }
        },
        onError: (e) => toast.error(apiErrorMessage(e, t.checkout.orderError)),
      },
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 font-display text-3xl">{t.checkout.title}</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {/* Fulfillment */}
          <section>
            <h2 className="mb-3 font-display text-lg">{t.checkout.howTitle}</h2>
            <div className="grid grid-cols-2 gap-3">
              <ToggleCard
                active={fulfillment === "delivery"}
                onClick={() => setFulfillment("delivery")}
                title={t.checkout.delivery}
                subtitle={`+ ${formatMoney(DELIVERY_FEE)}`}
              />
              <ToggleCard
                active={fulfillment === "pickup"}
                onClick={() => setFulfillment("pickup")}
                title={t.checkout.pickup}
                subtitle={t.checkout.free}
              />
            </div>
          </section>

          {/* Delivery details */}
          <AnimatePresence initial={false}>
            {fulfillment === "delivery" && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <h2 className="mb-3 font-display text-lg">{t.checkout.deliveryAddress}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>{t.checkout.addressLine1}</Label>
                    <Input
                      value={form.line1}
                      onChange={(e) => setForm({ ...form, line1: e.target.value })}
                      placeholder={t.checkout.addressLine1Placeholder}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t.checkout.addressLine2}</Label>
                    <Input
                      value={form.line2}
                      onChange={(e) => setForm({ ...form, line2: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t.checkout.city}</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t.checkout.postcode}</Label>
                    <Input
                      value={form.postcode}
                      onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t.checkout.phone}</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <section>
            <Label>{t.checkout.notesLabel}</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.checkout.notesPlaceholder}
            />
          </section>

          {/* Payment method */}
          <section>
            <h2 className="mb-3 font-display text-lg">{t.checkout.paymentTitle}</h2>
            <div className="grid grid-cols-2 gap-3">
              <ToggleCard
                active={method === "online"}
                onClick={() => setMethod("online")}
                title={t.checkout.payOnline}
                subtitle={t.checkout.card}
                icon={<CreditCard className="h-4 w-4" />}
                disabled={!stripeEnabled}
              />
              <ToggleCard
                active={method === "cash_on_delivery"}
                onClick={() => setMethod("cash_on_delivery")}
                title={t.checkout.payOnDelivery}
                subtitle={t.checkout.payOnDeliverySub}
                icon={<Wallet className="h-4 w-4" />}
              />
            </div>
            {!stripeEnabled && (
              <p className="mt-2 text-xs text-text-subtle">
                {t.checkout.stripeDisabled}
              </p>
            )}
          </section>

          {/* Stripe element appears after order is created */}
          {clientSecret ? (
            <section className="rounded-card border border-border bg-surface p-5">
              <h2 className="mb-4 font-display text-lg">{t.checkout.cardDetails}</h2>
              <StripePaymentSection
                clientSecret={clientSecret}
                amountLabel={amountLabel}
                onConfirmed={() => {
                  clearCart.mutate();
                  toast.success(t.checkout.paymentReceived);
                  navigate(`/order/confirmation/${pendingOrderId}`);
                }}
              />
            </section>
          ) : (
            <Button
              size="lg"
              className="w-full lg:hidden"
              loading={createOrder.isPending}
              onClick={placeOrder}
            >
              {method === "online"
                ? t.checkout.continueToPayment
                : `${t.checkout.placeOrder} · ${amountLabel}`}
            </Button>
          )}
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-card border border-border bg-surface p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 font-display text-lg">{t.checkout.orderSummary}</h2>
          <ul className="space-y-3">
            {cart?.items.map((item) => (
              <li key={item.line_id} className="flex justify-between gap-3 text-sm">
                <span>
                  <span className="text-text-muted">{item.quantity}×</span> {item.name}
                  <span className="block text-xs text-text-subtle">{item.size_name}</span>
                </span>
                <span className="tnum">{formatMoney(item.line_total_cents)}</span>
              </li>
            ))}
          </ul>
          <div className="my-4 h-px bg-border" />
          <div className="space-y-1.5 text-sm text-text-muted">
            <div className="flex justify-between">
              <span>{t.checkout.subtotal}</span>
              <span className="tnum">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{fulfillment === "delivery" ? t.checkout.delivery : t.checkout.pickup}</span>
              <span className="tnum">{deliveryFee ? formatMoney(deliveryFee) : t.checkout.free}</span>
            </div>
            <div className="flex justify-between pt-1 font-display text-xl text-text">
              <span>{t.checkout.total}</span>
              <span className="tnum text-primary">{formatMoney(total)}</span>
            </div>
          </div>
          {!clientSecret && (
            <Button
              size="lg"
              className="mt-5 hidden w-full lg:flex"
              loading={createOrder.isPending}
              onClick={placeOrder}
            >
              {method === "online"
                ? t.checkout.continueToPayment
                : `${t.checkout.placeOrder} · ${amountLabel}`}
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}

function ToggleCard({
  active,
  onClick,
  title,
  subtitle,
  icon,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-card border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-surface hover:border-border-strong",
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        {icon}
        {title}
      </div>
      <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>
    </button>
  );
}

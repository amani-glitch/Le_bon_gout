import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";
import { getStripe } from "@/lib/stripe";
import { useThemeStore } from "@/store/themeStore";

/**
 * Confirms an already-created PaymentIntent. The backend webhook is the source
 * of truth for marking the order paid; here we just trigger confirmation and
 * route the customer onward.
 */
function PaymentForm({
  onConfirmed,
  amountLabel,
}: {
  onConfirmed: () => void;
  amountLabel: string;
}) {
  const t = useT();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message ?? t.checkout.paymentFailed);
      return;
    }
    onConfirmed();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!stripe}>
        {t.checkout.pay} {amountLabel} {t.checkout.payAndPlace}
      </Button>
    </form>
  );
}

export function StripePaymentSection({
  clientSecret,
  amountLabel,
  onConfirmed,
}: {
  clientSecret: string;
  amountLabel: string;
  onConfirmed: () => void;
}) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: theme === "dark" ? "night" : "stripe",
          variables: { colorPrimary: "#f0b852", borderRadius: "10px" },
        },
      }}
    >
      <PaymentForm onConfirmed={onConfirmed} amountLabel={amountLabel} />
    </Elements>
  );
}

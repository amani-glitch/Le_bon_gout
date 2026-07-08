import { loadStripe, type Stripe } from "@stripe/stripe-js";

import { env, stripeEnabled } from "@/app/config/env";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripeEnabled) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(env.stripePublishableKey);
  return stripePromise;
}

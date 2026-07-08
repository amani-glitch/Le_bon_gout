import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/apiClient";
import type { CheckoutResponse, FulfillmentType, PaymentMethod } from "@/types/api";

export interface CheckoutPayload {
  payment_method: PaymentMethod;
  fulfillment_type: FulfillmentType;
  address?: {
    id: string;
    label: string;
    line1: string;
    line2?: string | null;
    city: string;
    postcode: string;
    phone?: string | null;
    is_default: boolean;
  } | null;
  notes?: string | null;
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (payload: CheckoutPayload) =>
      (await apiClient.post<CheckoutResponse>("/orders", payload)).data,
  });
}

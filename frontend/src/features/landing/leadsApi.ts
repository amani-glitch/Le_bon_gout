import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/apiClient";

export type LeadInterest = "basic" | "custom" | "unsure";

export interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  business_type?: string;
  interest?: LeadInterest;
  message?: string;
  locale?: string;
  /** Honeypot — must stay empty. */
  company_website?: string;
}

export async function submitLead(payload: LeadPayload): Promise<void> {
  await apiClient.post("/leads", payload);
}

export function useSubmitLead() {
  return useMutation({ mutationFn: submitLead });
}

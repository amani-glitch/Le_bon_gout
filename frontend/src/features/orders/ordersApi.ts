import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient, apiErrorMessage } from "@/lib/apiClient";
import type { Order, Page } from "@/types/api";

const ACTIVE = new Set(["pending", "confirmed", "preparing", "ready", "out_for_delivery"]);

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await apiClient.get<Page<Order>>("/orders")).data,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => (await apiClient.get<Order>(`/orders/${orderId}`)).data,
    enabled: !!orderId,
    // Poll live while the order is still in flight.
    refetchInterval: (query) =>
      query.state.data && ACTIVE.has(query.state.data.status) ? 10_000 : false,
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) =>
      (await apiClient.post<Order>(`/orders/${orderId}/cancel`)).data,
    onSuccess: (order) => {
      qc.setQueryData(["order", order.id], order);
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order cancelled");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

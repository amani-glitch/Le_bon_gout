import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient, apiErrorMessage } from "@/lib/apiClient";
import type { Cart } from "@/types/api";

export interface AddItemPayload {
  product_id: string;
  size_id: string;
  topping_ids: string[];
  quantity: number;
  notes?: string | null;
}

export interface UpdateItemPayload {
  quantity?: number;
  size_id?: string;
  topping_ids?: string[];
  notes?: string | null;
}

const KEY = ["cart"];

export function useCart(enabled: boolean) {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await apiClient.get<Cart>("/cart")).data,
    enabled,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddItemPayload) =>
      (await apiClient.post<Cart>("/cart/items", payload)).data,
    onSuccess: (cart) => {
      qc.setQueryData(KEY, cart);
      toast.success("Added to your tray");
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Couldn't add to cart")),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lineId, payload }: { lineId: string; payload: UpdateItemPayload }) =>
      (await apiClient.patch<Cart>(`/cart/items/${lineId}`, payload)).data,
    onSuccess: (cart) => qc.setQueryData(KEY, cart),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lineId: string) =>
      (await apiClient.delete<Cart>(`/cart/items/${lineId}`)).data,
    onSuccess: (cart) => qc.setQueryData(KEY, cart),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await apiClient.delete<Cart>("/cart")).data,
    onSuccess: (cart) => qc.setQueryData(KEY, cart),
  });
}

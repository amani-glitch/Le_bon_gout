import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient, apiErrorMessage } from "@/lib/apiClient";
import type { Cart, Favorite } from "@/types/api";

export function useFavorites(enabled = true) {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => (await apiClient.get<Favorite[]>("/favorites")).data,
    enabled,
  });
}

export interface AddFavoritePayload {
  product_id: string;
  size_id: string;
  topping_ids: string[];
}

export function useAddFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddFavoritePayload) =>
      (await apiClient.post<Favorite>("/favorites", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Saved to favourites");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (favId: string) => {
      await apiClient.delete(`/favorites/${favId}`);
      return favId;
    },
    onMutate: async (favId) => {
      await qc.cancelQueries({ queryKey: ["favorites"] });
      const prev = qc.getQueryData<Favorite[]>(["favorites"]);
      qc.setQueryData<Favorite[]>(["favorites"], (old) =>
        (old ?? []).filter((f) => f.id !== favId),
      );
      return { prev };
    },
    onError: (e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["favorites"], ctx.prev);
      toast.error(apiErrorMessage(e));
    },
  });
}

export function useFavoriteToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (favId: string) =>
      (await apiClient.post<Cart>(`/favorites/${favId}/add-to-cart`)).data,
    onSuccess: (cart) => {
      qc.setQueryData(["cart"], cart);
      toast.success("Added to your tray");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

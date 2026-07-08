import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/apiClient";
import type { Category, Product } from "@/types/api";

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ["products", category ?? "all"],
    queryFn: async () =>
      (
        await apiClient.get<Product[]>("/products", {
          params: category ? { category } : undefined,
        })
      ).data,
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => (await apiClient.get<Product>(`/products/${productId}`)).data,
    enabled: !!productId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await apiClient.get<Category[]>("/categories")).data,
  });
}

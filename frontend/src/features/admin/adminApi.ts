import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { dictionaries, useLangStore } from "@/i18n/langStore";
import { apiClient, apiErrorMessage } from "@/lib/apiClient";
import type {
  BotConversation,
  BotConversationSummary,
  BotStats,
  DashboardMetrics,
  Lead,
  LeadStatus,
  Order,
  OrderStatus,
  Page,
  PaymentStatus,
  Product,
  User,
} from "@/types/api";

import { DEMO_ACTION_MESSAGE, useIsDemo } from "./demo/demoContext";
import {
  demoBotStats,
  demoConversation,
  demoConversations,
  demoCustomers,
  demoLeads,
  demoMetrics,
  demoOrders,
  demoProducts,
} from "./demo/demoData";

/** Wrap a static fixture as a resolved page for the preview. */
function page<T>(items: T[]): Page<T> {
  return { items, has_more: false, next_cursor: null };
}

/** Admin toast copy in the active language (used outside React render). */
function adminToast() {
  return dictionaries[useLangStore.getState().lang].admin.toast;
}

// ── Metrics ────────────────────────────────────────────────────
export function useMetrics() {
  const demo = useIsDemo();
  return useQuery({
    queryKey: ["admin", "metrics", demo],
    queryFn: async () => (await apiClient.get<DashboardMetrics>("/admin/metrics")).data,
    initialData: demo ? demoMetrics : undefined,
    enabled: !demo,
    refetchInterval: demo ? false : 30_000,
  });
}

// ── Orders ─────────────────────────────────────────────────────
export function useAdminOrders(status?: string) {
  const demo = useIsDemo();
  return useQuery({
    queryKey: ["admin", "orders", status ?? "all", demo],
    queryFn: async () =>
      (
        await apiClient.get<Page<Order>>("/admin/orders", {
          params: status ? { status } : undefined,
        })
      ).data,
    initialData: demo
      ? page(status ? demoOrders.filter((o) => o.status === status) : demoOrders)
      : undefined,
    enabled: !demo,
    refetchInterval: demo ? false : 20_000,
  });
}

export function useUpdateOrderStatus() {
  const demo = useIsDemo();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      paymentStatus,
    }: {
      orderId: string;
      status: OrderStatus;
      paymentStatus?: PaymentStatus;
    }) => {
      if (demo) return null;
      return (
        await apiClient.patch<Order>(`/admin/orders/${orderId}/status`, {
          status,
          payment_status: paymentStatus,
        })
      ).data;
    },
    onSuccess: () => {
      if (demo) {
        toast.info(DEMO_ACTION_MESSAGE);
        return;
      }
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "metrics"] });
      toast.success(adminToast().orderUpdated);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

// ── Products ───────────────────────────────────────────────────
export function useAdminProducts() {
  const demo = useIsDemo();
  return useQuery({
    queryKey: ["admin", "products", demo],
    queryFn: async () => (await apiClient.get<Product[]>("/admin/products")).data,
    initialData: demo ? demoProducts : undefined,
    enabled: !demo,
  });
}

export function useAdminProduct(productId?: string) {
  const demo = useIsDemo();
  return useQuery({
    queryKey: ["admin", "product", productId, demo],
    queryFn: async () => (await apiClient.get<Product>(`/products/${productId}`)).data,
    initialData: demo ? demoProducts.find((p) => p.id === productId) : undefined,
    enabled: !demo && !!productId,
  });
}

export function useSaveProduct() {
  const demo = useIsDemo();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Partial<Product> }) => {
      if (demo) return null;
      if (id) return (await apiClient.patch<Product>(`/admin/products/${id}`, payload)).data;
      return (await apiClient.post<Product>("/admin/products", payload)).data;
    },
    onSuccess: () => {
      if (demo) {
        toast.info(DEMO_ACTION_MESSAGE);
        return;
      }
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(adminToast().productSaved);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

export function useDeleteProduct() {
  const demo = useIsDemo();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (demo) return;
      await apiClient.delete(`/admin/products/${id}`);
    },
    onSuccess: () => {
      if (demo) {
        toast.info(DEMO_ACTION_MESSAGE);
        return;
      }
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(adminToast().productRemoved);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

// ── Botler concierge ───────────────────────────────────────────
export function useBotStats() {
  const demo = useIsDemo();
  return useQuery({
    queryKey: ["admin", "bot", "stats", demo],
    queryFn: async () => (await apiClient.get<BotStats>("/admin/bot/stats")).data,
    initialData: demo ? demoBotStats : undefined,
    enabled: !demo,
    refetchInterval: demo ? false : 30_000,
  });
}

export function useBotConversations(channel?: string) {
  const demo = useIsDemo();
  return useQuery({
    queryKey: ["admin", "bot", "conversations", channel ?? "all", demo],
    queryFn: async () =>
      (
        await apiClient.get<Page<BotConversationSummary>>("/admin/bot/conversations", {
          params: channel ? { channel } : undefined,
        })
      ).data,
    initialData: demo
      ? page(channel ? demoConversations.filter((c) => c.channel === channel) : demoConversations)
      : undefined,
    enabled: !demo,
    refetchInterval: demo ? false : 20_000,
  });
}

export function useBotConversation(conversationId?: string) {
  const demo = useIsDemo();
  return useQuery({
    queryKey: ["admin", "bot", "conversation", conversationId, demo],
    queryFn: async () =>
      (await apiClient.get<BotConversation>(`/admin/bot/conversations/${conversationId}`)).data,
    initialData: demo && conversationId ? demoConversation(conversationId) : undefined,
    enabled: !demo && !!conversationId,
  });
}

// ── Leads (B2B) ────────────────────────────────────────────────
export function useAdminLeads(status?: string) {
  const demo = useIsDemo();
  return useQuery({
    queryKey: ["admin", "leads", status ?? "all", demo],
    queryFn: async () =>
      (
        await apiClient.get<Page<Lead>>("/admin/leads", {
          params: status ? { status } : undefined,
        })
      ).data,
    initialData: demo
      ? page(status ? demoLeads.filter((l) => l.status === status) : demoLeads)
      : undefined,
    enabled: !demo,
    refetchInterval: demo ? false : 30_000,
  });
}

export function useUpdateLeadStatus() {
  const demo = useIsDemo();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: LeadStatus }) => {
      if (demo) return null;
      return (await apiClient.patch<Lead>(`/admin/leads/${leadId}`, { status })).data;
    },
    onSuccess: () => {
      if (demo) {
        toast.info(DEMO_ACTION_MESSAGE);
        return;
      }
      qc.invalidateQueries({ queryKey: ["admin", "leads"] });
      toast.success(adminToast().leadUpdated);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

// ── Customers ──────────────────────────────────────────────────
export function useAdminCustomers(search?: string) {
  const demo = useIsDemo();
  return useQuery({
    queryKey: ["admin", "customers", search ?? "", demo],
    queryFn: async () =>
      (
        await apiClient.get<Page<User>>("/admin/customers", {
          params: search ? { search } : undefined,
        })
      ).data,
    initialData: demo
      ? page(
          search
            ? demoCustomers.filter((c) =>
                `${c.display_name} ${c.email}`.toLowerCase().includes(search.toLowerCase()),
              )
            : demoCustomers,
        )
      : undefined,
    enabled: !demo,
  });
}

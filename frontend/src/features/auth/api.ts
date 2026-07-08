import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/apiClient";
import type { User } from "@/types/api";

async function fetchMe(): Promise<User | null> {
  try {
    const { data } = await apiClient.get<User>("/auth/me");
    return data;
  } catch {
    return null; // 401 => not signed in
  }
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 60_000,
    retry: false,
  });
}

export function useGoogleLoginUrl() {
  return useMutation({
    mutationFn: async (state?: string) => {
      const { data } = await apiClient.get<{ url: string }>("/auth/google/url", {
        params: { state },
      });
      return data.url;
    },
  });
}

export function useExchangeCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await apiClient.post<{ user: User }>("/auth/google", { code });
      return data.user;
    },
    onSuccess: (user) => qc.setQueryData(["me"], user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post("/auth/logout");
    },
    onSuccess: () => {
      qc.setQueryData(["me"], null);
      qc.clear();
    },
  });
}

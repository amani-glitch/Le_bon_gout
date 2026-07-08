import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiClient, apiErrorMessage } from "@/lib/apiClient";
import type { Address, Preferences, User } from "@/types/api";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await apiClient.get<User>("/profile")).data,
  });
}

export interface ProfileUpdatePayload {
  display_name?: string;
  phone?: string | null;
  preferences?: Preferences;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProfileUpdatePayload) =>
      (await apiClient.patch<User>("/profile", payload)).data,
    onSuccess: (user) => {
      qc.setQueryData(["profile"], user);
      qc.setQueryData(["me"], user);
      toast.success("Saved");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

export type AddressPayload = Omit<Address, "id">;

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddressPayload) =>
      (await apiClient.post<Address>("/profile/addresses", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Address added");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addressId: string) => {
      await apiClient.delete(`/profile/addresses/${addressId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Address removed");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
}

import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import { env } from "@/app/config/env";

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true, // send/receive the httpOnly session cookie
});

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export function apiErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return body?.error?.message ?? error.message ?? fallback;
  }
  return fallback;
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    // 401 on /auth/me is the normal "not signed in" probe — stay silent.
    if (status === 401 && !url.includes("/auth/me")) {
      onUnauthorized?.();
    }
    if (status === 403) {
      toast.error(apiErrorMessage(error, "You don't have access to that."));
    }
    return Promise.reject(error);
  },
);

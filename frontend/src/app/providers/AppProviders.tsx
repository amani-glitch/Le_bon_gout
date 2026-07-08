import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "sonner";

import { setUnauthorizedHandler } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import { useThemeStore } from "@/store/themeStore";

function UnauthorizedBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.setQueryData(["me"], null);
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    });
  }, [navigate]);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <QueryClientProvider client={queryClient}>
      <UnauthorizedBridge />
      {children}
      <Toaster
        position="top-right"
        theme={theme}
        toastOptions={{
          style: {
            background: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </QueryClientProvider>
  );
}

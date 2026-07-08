import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { apiErrorMessage } from "@/lib/apiClient";

import { useExchangeCode } from "./api";

export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const exchange = useExchangeCode();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React StrictMode double-invoke
    ran.current = true;

    const code = params.get("code");
    const state = params.get("state");
    const next = state && state.startsWith("/") ? state : "/menu";

    if (!code) {
      setError("No authorization code received from Google.");
      return;
    }
    exchange.mutate(code, {
      onSuccess: () => navigate(next, { replace: true }),
      onError: (e) => setError(apiErrorMessage(e, "Sign-in failed.")),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <img
        src="/images/lebongout-hero.jpg"
        alt="Le Bon Gout"
        className="mb-6 h-20 w-20 animate-float rounded-full object-cover ring-1 ring-primary/40"
      />
      {error ? (
        <>
          <p className="font-display text-xl text-danger">We couldn't sign you in</p>
          <p className="mt-2 max-w-sm text-sm text-text-muted">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="mt-5 text-sm font-medium text-primary hover:underline"
          >
            Try again
          </button>
        </>
      ) : (
        <p className="font-display text-xl">Letting you in…</p>
      )}
    </div>
  );
}

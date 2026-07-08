import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { AmberOrb } from "@/components/brand/AmberOrb";
import { Button } from "@/components/ui/Button";
import { apiErrorMessage } from "@/lib/apiClient";

import { useGoogleLoginUrl } from "./api";
import { useAuth } from "./useAuth";

export function LoginPage() {
  const [params] = useSearchParams();
  const next = params.get("next") ?? "/menu";
  const navigate = useNavigate();
  const { isAuthenticated, isResolved } = useAuth();
  const loginUrl = useGoogleLoginUrl();

  useEffect(() => {
    if (isResolved && isAuthenticated) navigate(next, { replace: true });
  }, [isResolved, isAuthenticated, navigate, next]);

  function handleLogin() {
    loginUrl.mutate(next, {
      onSuccess: (url) => {
        window.location.href = url;
      },
      onError: (e) => toast.error(apiErrorMessage(e, "Couldn't start sign-in")),
    });
  }

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <AmberOrb className="left-1/2 top-10 -translate-x-1/2" size={280} />
      <img
        src="/images/lebongout-hero.jpg"
        alt="Le Bon Gout"
        className="relative mb-6 h-24 w-24 rounded-full object-cover ring-1 ring-primary/40"
      />
      <h1 className="relative font-display text-3xl">Welcome back</h1>
      <p className="relative mt-2 text-text-muted">
        Sign in to order, track deliveries and save your favourites.
      </p>
      <Button
        size="lg"
        className="relative mt-8 w-full"
        loading={loginUrl.isPending}
        onClick={handleLogin}
      >
        <GoogleGlyph /> Continue with Google
      </Button>
      <p className="relative mt-4 text-xs text-text-subtle">
        By continuing you agree to our terms of service.
      </p>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1A6.2 6.2 0 0 1 12 5.8c1.77 0 2.96.75 3.64 1.4l2.48-2.4C16.5 3.2 14.46 2.3 12 2.3a9.7 9.7 0 1 0 0 19.4c5.6 0 9.3-3.94 9.3-9.5 0-.64-.07-1.13-.16-1.6H12z"
      />
    </svg>
  );
}

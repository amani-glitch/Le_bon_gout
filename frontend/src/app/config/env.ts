const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export const env = {
  apiUrl,
  // WebSocket base for the voice bot. Falls back to the API URL with the
  // http(s) scheme swapped for ws(s).
  wsUrl: import.meta.env.VITE_WS_URL ?? apiUrl.replace(/^http/, "ws"),
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "",
  googleRedirectUri:
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? "http://localhost:5173/auth/callback",
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
};

export const stripeEnabled =
  !!env.stripePublishableKey && env.stripePublishableKey.startsWith("pk_");

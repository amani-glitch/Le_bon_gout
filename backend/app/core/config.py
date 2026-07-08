"""Application settings — single source of truth for environment configuration."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed settings loaded from the project-root .env file.

    The backend runs from ``backend/`` but the shared ``.env`` and
    ``service-account.json`` live in the repository root, hence ``../.env``.
    """

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ── Google OAuth ──────────────────────────────────────────────
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str = "http://localhost:5173/auth/callback"

    # ── Firestore / service account ───────────────────────────────
    google_service_account_json: str = "../service-account.json"
    firestore_project_id: str = "adp-413110"
    # Named Firestore database within the project. Le Bon Goût runs in its own
    # database ("lebongout") so its data is fully isolated from any other app in
    # the same GCP project. Use "(default)" for the project's default database.
    firestore_database: str = "lebongout"

    # ── Stripe ────────────────────────────────────────────────────
    stripe_secret_key: str
    stripe_webhook_secret: str

    # ── Gemini (Botler concierge: chat + voice) ───────────────────
    gemini_api_key: str = ""
    gemini_chat_model: str = "gemini-3.1-pro-preview"
    # Latency knob for the chat model's internal reasoning. -1 lets the model
    # decide; a positive value caps the thinking token budget; 0 disables
    # "thinking" entirely — but that is REJECTED by thinking-only models such as
    # gemini-3.1-pro-preview (400 "Budget 0 is invalid"), so only use 0 on a
    # Flash model that supports it. Override via .env.
    gemini_thinking_budget: int = -1
    # Half-cascade real-time model for the Live API (gemini-2.0-flash-live-001
    # was retired). Strong function-calling for the concierge tools. Alternatives
    # if your key lacks access: gemini-2.5-flash-native-audio-latest (native audio).
    # Override via .env. Confirm access with ListModels (bidiGenerateContent).
    gemini_live_model: str = "gemini-3.1-flash-live-preview"
    # One of the prebuilt Live voices (Puck, Charon, Kore, Fenrir, Aoede…).
    gemini_voice: str = "Puck"

    # ── Auth / JWT ────────────────────────────────────────────────
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    # Comma-separated raw strings — parsed into lists via the properties below.
    # (Kept as str so pydantic-settings doesn't attempt JSON parsing of env vars.)
    admin_emails: str = ""

    # ── App ───────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:5173"
    cookie_secure: bool = False
    cookie_name: str = "lebongout_session"
    # Tunisian dinar. Prices are stored as integer minor units (1 DT = 100).
    currency: str = "tnd"
    delivery_fee_cents: int = 0

    @staticmethod
    def _split_csv(value: str) -> list[str]:
        return [item.strip() for item in value.split(",") if item.strip()]

    @property
    def admin_emails_list(self) -> list[str]:
        return self._split_csv(self.admin_emails)

    @property
    def admin_emails_lower(self) -> set[str]:
        return {email.lower() for email in self.admin_emails_list}

    @property
    def cors_origins_list(self) -> list[str]:
        return self._split_csv(self.cors_origins)


@lru_cache
def get_settings() -> Settings:
    """Return a process-wide cached Settings instance."""
    return Settings()  # type: ignore[call-arg]

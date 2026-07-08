"""Authentication service — Google OAuth2 code exchange and user upsert."""
from __future__ import annotations

from urllib.parse import urlencode

import httpx
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.core.config import Settings
from app.core.exceptions import AuthError
from app.enums import UserRole
from app.repositories.user_repo import UserRepository
from app.schemas.user import User

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_SCOPES = "openid email profile"


class AuthService:
    def __init__(self, settings: Settings, users: UserRepository) -> None:
        self._settings = settings
        self._users = users

    def build_login_url(self, state: str | None = None) -> str:
        params = {
            "client_id": self._settings.google_client_id,
            "redirect_uri": self._settings.google_redirect_uri,
            "response_type": "code",
            "scope": GOOGLE_SCOPES,
            "access_type": "offline",
            "include_granted_scopes": "true",
            "prompt": "select_account",
        }
        if state:
            params["state"] = state
        return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    async def login_with_google(self, code: str, redirect_uri: str | None = None) -> User:
        claims = await self._exchange_code(code, redirect_uri)
        return self._upsert_user(claims)

    async def _exchange_code(self, code: str, redirect_uri: str | None) -> dict:
        data = {
            "code": code,
            "client_id": self._settings.google_client_id,
            "client_secret": self._settings.google_client_secret,
            "redirect_uri": redirect_uri or self._settings.google_redirect_uri,
            "grant_type": "authorization_code",
        }
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(GOOGLE_TOKEN_URL, data=data)
        if resp.status_code != 200:
            raise AuthError("Google sign-in failed.", details=resp.text)

        token_data = resp.json()
        raw_id_token = token_data.get("id_token")
        if not raw_id_token:
            raise AuthError("Google did not return an identity token.")

        try:
            claims = id_token.verify_oauth2_token(
                raw_id_token,
                google_requests.Request(),
                self._settings.google_client_id,
            )
        except ValueError as exc:
            raise AuthError("Could not verify Google identity token.") from exc
        return claims

    def _upsert_user(self, claims: dict) -> User:
        sub = claims["sub"]
        email = claims.get("email", "")
        existing = self._users.get(sub)

        is_admin_email = email.lower() in self._settings.admin_emails_lower
        now = self._users.now()

        if existing:
            role = existing.get("role", UserRole.customer.value)
            # Promote allowlisted emails, never silently demote stored admins.
            if is_admin_email:
                role = UserRole.admin.value
            update = {
                "email": email,
                "display_name": claims.get("name") or existing.get("display_name") or email,
                "photo_url": claims.get("picture"),
                "role": role,
            }
            data = self._users.update(sub, update)
        else:
            role = UserRole.admin.value if is_admin_email else UserRole.customer.value
            data = self._users.set(
                sub,
                {
                    "email": email,
                    "display_name": claims.get("name") or email,
                    "photo_url": claims.get("picture"),
                    "role": role,
                    "phone": None,
                    "addresses": [],
                    "preferences": {
                        "default_fulfillment": "delivery",
                        "marketing_opt_in": False,
                        "dietary": [],
                    },
                    "created_at": now,
                    "updated_at": now,
                },
            )
        return User.model_validate(data)

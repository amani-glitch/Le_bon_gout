"""Authentication request/response schemas."""
from __future__ import annotations

from app.enums import UserRole
from app.schemas.common import ApiModel
from app.schemas.user import User


class GoogleAuthRequest(ApiModel):
    """Authorization code returned to the SPA by Google."""

    code: str
    redirect_uri: str | None = None


class AuthResponse(ApiModel):
    user: User


class LoginUrlResponse(ApiModel):
    url: str


class CurrentUser(ApiModel):
    """Identity decoded from the session JWT (no DB read required)."""

    id: str
    email: str
    role: UserRole

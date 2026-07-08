"""JWT signing/verification and session-cookie helpers."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Response

from app.core.config import Settings
from app.core.exceptions import AuthError


def create_access_token(settings: Settings, *, sub: str, email: str, role: str) -> str:
    """Mint a signed session JWT for the given user."""
    now = datetime.now(UTC)
    payload = {
        "sub": sub,
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(settings: Settings, token: str) -> dict:
    """Decode and validate a session JWT, raising AuthError on failure."""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("Session expired. Please sign in again.") from exc
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid session token.") from exc


def set_session_cookie(response: Response, settings: Settings, token: str) -> None:
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(key=settings.cookie_name, path="/")

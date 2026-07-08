"""Authentication routes — Google OAuth2 login, current user, logout."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app.api.deps import (
    CurrentUserDep,
    SettingsDep,
    get_auth_service,
    get_user_service,
)
from app.core.security import clear_session_cookie, create_access_token, set_session_cookie
from app.schemas.auth import AuthResponse, GoogleAuthRequest, LoginUrlResponse
from app.schemas.user import User
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/url", response_model=LoginUrlResponse)
def google_login_url(
    auth: Annotated[AuthService, Depends(get_auth_service)],
    state: str | None = None,
) -> LoginUrlResponse:
    return LoginUrlResponse(url=auth.build_login_url(state))


@router.post("/google", response_model=AuthResponse)
async def google_login(
    payload: GoogleAuthRequest,
    response: Response,
    settings: SettingsDep,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    user = await auth.login_with_google(payload.code, payload.redirect_uri)
    token = create_access_token(
        settings, sub=user.id, email=user.email, role=user.role.value
    )
    set_session_cookie(response, settings, token)
    return AuthResponse(user=user)


@router.get("/me", response_model=User)
def me(
    current: CurrentUserDep,
    users: Annotated[UserService, Depends(get_user_service)],
) -> User:
    return users.get(current.id)


@router.post("/logout")
def logout(response: Response, settings: SettingsDep) -> dict:
    clear_session_cookie(response, settings)
    return {"ok": True}

"""Dependency-injection providers wiring repositories, services and auth."""
from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Request
from google.cloud import firestore

from app.bot.agent import BotAgent
from app.bot.sales import SALES_SYSTEM_INSTRUCTION, SALES_TOOL_DECLARATIONS
from app.bot.tools import BOT_TOOL_DECLARATIONS
from app.core.config import Settings, get_settings
from app.core.exceptions import AppError, ForbiddenError, UnauthorizedError
from app.core.firestore import get_db
from app.core.security import decode_access_token
from app.enums import UserRole
from app.repositories.bot_conversation_repo import BotConversationRepository
from app.repositories.cart_repo import CartRepository
from app.repositories.favorite_repo import FavoriteRepository
from app.repositories.lead_repo import LeadRepository
from app.repositories.order_repo import OrderRepository
from app.repositories.product_repo import CategoryRepository, ProductRepository
from app.repositories.user_repo import UserRepository
from app.schemas.auth import CurrentUser
from app.services.auth_service import AuthService
from app.services.bot_conversation_service import BotConversationService
from app.services.cart_service import CartService
from app.services.favorite_service import FavoriteService
from app.services.lead_service import LeadService
from app.services.metrics_service import MetricsService
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.services.product_service import ProductService
from app.services.user_service import UserService

SettingsDep = Annotated[Settings, Depends(get_settings)]
DbDep = Annotated[firestore.Client, Depends(get_db)]


# ── Repositories ──────────────────────────────────────────────────
def get_user_repo(db: DbDep) -> UserRepository:
    return UserRepository(db)


def get_product_repo(db: DbDep) -> ProductRepository:
    return ProductRepository(db)


def get_category_repo(db: DbDep) -> CategoryRepository:
    return CategoryRepository(db)


def get_cart_repo(db: DbDep) -> CartRepository:
    return CartRepository(db)


def get_order_repo(db: DbDep) -> OrderRepository:
    return OrderRepository(db)


def get_favorite_repo(db: DbDep) -> FavoriteRepository:
    return FavoriteRepository(db)


def get_bot_conversation_repo(db: DbDep) -> BotConversationRepository:
    return BotConversationRepository(db)


def get_lead_repo(db: DbDep) -> LeadRepository:
    return LeadRepository(db)


# ── Services ──────────────────────────────────────────────────────
def get_auth_service(
    settings: SettingsDep, users: Annotated[UserRepository, Depends(get_user_repo)]
) -> AuthService:
    return AuthService(settings, users)


def get_user_service(
    users: Annotated[UserRepository, Depends(get_user_repo)],
) -> UserService:
    return UserService(users)


def get_product_service(
    products: Annotated[ProductRepository, Depends(get_product_repo)],
    categories: Annotated[CategoryRepository, Depends(get_category_repo)],
) -> ProductService:
    return ProductService(products, categories)


def get_cart_service(
    carts: Annotated[CartRepository, Depends(get_cart_repo)],
    products: Annotated[ProductService, Depends(get_product_service)],
) -> CartService:
    return CartService(carts, products)


def get_payment_service(settings: SettingsDep) -> PaymentService:
    return PaymentService(settings)


def get_order_service(
    orders: Annotated[OrderRepository, Depends(get_order_repo)],
    carts: Annotated[CartService, Depends(get_cart_service)],
    payments: Annotated[PaymentService, Depends(get_payment_service)],
    settings: SettingsDep,
) -> OrderService:
    return OrderService(orders, carts, payments, settings)


def get_favorite_service(
    favorites: Annotated[FavoriteRepository, Depends(get_favorite_repo)],
    products: Annotated[ProductService, Depends(get_product_service)],
    carts: Annotated[CartService, Depends(get_cart_service)],
) -> FavoriteService:
    return FavoriteService(favorites, products, carts)


def get_bot_conversation_service(
    repo: Annotated[BotConversationRepository, Depends(get_bot_conversation_repo)],
) -> BotConversationService:
    return BotConversationService(repo)


def get_lead_service(
    repo: Annotated[LeadRepository, Depends(get_lead_repo)],
) -> LeadService:
    return LeadService(repo)


def get_metrics_service(
    orders: Annotated[OrderRepository, Depends(get_order_repo)],
    users: Annotated[UserRepository, Depends(get_user_repo)],
) -> MetricsService:
    return MetricsService(orders, users)


# ── Auth ──────────────────────────────────────────────────────────
def get_current_user(request: Request, settings: SettingsDep) -> CurrentUser:
    token = request.cookies.get(settings.cookie_name)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise UnauthorizedError("Authentication required.")
    claims = decode_access_token(settings, token)
    return CurrentUser(id=claims["sub"], email=claims["email"], role=UserRole(claims["role"]))


def require_admin(
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    if user.role != UserRole.admin:
        raise ForbiddenError("Administrator access required.")
    return user


def get_optional_user(request: Request, settings: SettingsDep) -> CurrentUser | None:
    """Like ``get_current_user`` but returns ``None`` instead of raising.

    Used by the bot so anonymous visitors can ask about the menu; cart/order
    tools still require a signed-in user.
    """
    token = request.cookies.get(settings.cookie_name)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        return None
    try:
        claims = decode_access_token(settings, token)
    except AppError:
        return None
    return CurrentUser(id=claims["sub"], email=claims["email"], role=UserRole(claims["role"]))


def resolve_ws_user(request: Request, settings: Settings) -> CurrentUser | None:
    """Resolve the user for a WebSocket from its cookie or ``?token=`` param.

    Accepts a ``WebSocket`` (shares ``.cookies``/``.query_params`` with Request).
    """
    token = request.cookies.get(settings.cookie_name)
    if not token:
        token = request.query_params.get("token")
    if not token:
        return None
    try:
        claims = decode_access_token(settings, token)
    except AppError:
        return None
    return CurrentUser(id=claims["sub"], email=claims["email"], role=UserRole(claims["role"]))


# ── Bot (Gemini: B2C concierge + B2B sales) ───────────────────────
@lru_cache
def _build_bot_agent(api_key: str, model: str, thinking_budget: int) -> BotAgent:
    return BotAgent(
        api_key=api_key,
        model=model,
        thinking_budget=thinking_budget,
        tools=BOT_TOOL_DECLARATIONS,
    )


@lru_cache
def _build_sales_agent(api_key: str, model: str, thinking_budget: int) -> BotAgent:
    return BotAgent(
        api_key=api_key,
        model=model,
        thinking_budget=thinking_budget,
        system_instruction=SALES_SYSTEM_INSTRUCTION,
        tools=SALES_TOOL_DECLARATIONS,
    )


def get_bot_agent(settings: SettingsDep) -> BotAgent:
    if not settings.gemini_api_key:
        raise UnauthorizedError("The concierge is unavailable (GEMINI_API_KEY not set).")
    return _build_bot_agent(
        settings.gemini_api_key, settings.gemini_chat_model, settings.gemini_thinking_budget
    )


def get_sales_bot_agent(settings: SettingsDep) -> BotAgent:
    if not settings.gemini_api_key:
        raise UnauthorizedError("The assistant is unavailable (GEMINI_API_KEY not set).")
    return _build_sales_agent(
        settings.gemini_api_key, settings.gemini_chat_model, settings.gemini_thinking_budget
    )


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
AdminDep = Annotated[CurrentUser, Depends(require_admin)]
OptionalUserDep = Annotated[CurrentUser | None, Depends(get_optional_user)]

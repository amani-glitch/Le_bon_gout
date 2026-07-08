"""Customer order routes — checkout, history, tracking, cancel."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUserDep, get_order_service, get_user_service
from app.schemas.common import Page
from app.schemas.order import CheckoutRequest, CheckoutResponse, Order
from app.services.order_service import OrderService
from app.services.user_service import UserService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=CheckoutResponse)
def checkout(
    payload: CheckoutRequest,
    user: CurrentUserDep,
    orders: Annotated[OrderService, Depends(get_order_service)],
    users: Annotated[UserService, Depends(get_user_service)],
) -> CheckoutResponse:
    full_user = users.get(user.id)
    return orders.checkout(full_user, payload)


@router.get("", response_model=Page[Order])
def list_orders(
    user: CurrentUserDep,
    orders: Annotated[OrderService, Depends(get_order_service)],
    limit: int = 20,
    cursor: str | None = None,
) -> Page[Order]:
    items, next_cursor = orders.list_for_user(user.id, limit=limit, cursor=cursor)
    return Page(items=items, next_cursor=next_cursor, has_more=next_cursor is not None)


@router.get("/{order_id}", response_model=Order)
def get_order(
    order_id: str,
    user: CurrentUserDep,
    orders: Annotated[OrderService, Depends(get_order_service)],
) -> Order:
    return orders.get_for_user(user, order_id)


@router.post("/{order_id}/cancel", response_model=Order)
def cancel_order(
    order_id: str,
    user: CurrentUserDep,
    orders: Annotated[OrderService, Depends(get_order_service)],
) -> Order:
    return orders.cancel_own(user, order_id)

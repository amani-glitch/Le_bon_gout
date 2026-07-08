"""Admin order management."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import AdminDep, get_order_service
from app.schemas.common import Page
from app.schemas.order import Order, OrderStatusUpdate
from app.services.order_service import OrderService

router = APIRouter(prefix="/admin/orders", tags=["admin:orders"])


@router.get("", response_model=Page[Order])
def list_orders(
    admin: AdminDep,
    orders: Annotated[OrderService, Depends(get_order_service)],
    status: str | None = None,
    limit: int = 25,
    cursor: str | None = None,
) -> Page[Order]:
    items, next_cursor = orders.list_admin(status=status, limit=limit, cursor=cursor)
    return Page(items=items, next_cursor=next_cursor, has_more=next_cursor is not None)


@router.get("/{order_id}", response_model=Order)
def get_order(
    order_id: str,
    admin: AdminDep,
    orders: Annotated[OrderService, Depends(get_order_service)],
) -> Order:
    return orders.get_admin(order_id)


@router.patch("/{order_id}/status", response_model=Order)
def update_status(
    order_id: str,
    payload: OrderStatusUpdate,
    admin: AdminDep,
    orders: Annotated[OrderService, Depends(get_order_service)],
) -> Order:
    return orders.update_status(order_id, payload, by=admin.email)

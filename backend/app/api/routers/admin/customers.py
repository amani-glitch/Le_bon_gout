"""Admin customer management."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import AdminDep, get_order_service, get_user_service
from app.schemas.common import Page
from app.schemas.order import Order
from app.schemas.user import RoleUpdate, User
from app.services.order_service import OrderService
from app.services.user_service import UserService

router = APIRouter(prefix="/admin/customers", tags=["admin:customers"])


@router.get("", response_model=Page[User])
def list_customers(
    admin: AdminDep,
    users: Annotated[UserService, Depends(get_user_service)],
    limit: int = 25,
    cursor: str | None = None,
    search: str | None = None,
) -> Page[User]:
    items, next_cursor = users.list_customers(limit=limit, cursor=cursor, search=search)
    return Page(items=items, next_cursor=next_cursor, has_more=next_cursor is not None)


@router.get("/{customer_id}", response_model=User)
def get_customer(
    customer_id: str,
    admin: AdminDep,
    users: Annotated[UserService, Depends(get_user_service)],
) -> User:
    return users.get(customer_id)


@router.get("/{customer_id}/orders", response_model=Page[Order])
def get_customer_orders(
    customer_id: str,
    admin: AdminDep,
    orders: Annotated[OrderService, Depends(get_order_service)],
    limit: int = 25,
    cursor: str | None = None,
) -> Page[Order]:
    items, next_cursor = orders.list_for_user(customer_id, limit=limit, cursor=cursor)
    return Page(items=items, next_cursor=next_cursor, has_more=next_cursor is not None)


@router.patch("/{customer_id}/role", response_model=User)
def set_role(
    customer_id: str,
    payload: RoleUpdate,
    admin: AdminDep,
    users: Annotated[UserService, Depends(get_user_service)],
) -> User:
    return users.set_role(customer_id, payload.role)

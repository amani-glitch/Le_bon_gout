"""Cart routes (authenticated)."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUserDep, get_cart_service
from app.schemas.cart import AddItemRequest, Cart, UpdateItemRequest
from app.services.cart_service import CartService

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=Cart)
def get_cart(
    user: CurrentUserDep,
    carts: Annotated[CartService, Depends(get_cart_service)],
) -> Cart:
    return carts.get_cart(user.id)


@router.post("/items", response_model=Cart)
def add_item(
    payload: AddItemRequest,
    user: CurrentUserDep,
    carts: Annotated[CartService, Depends(get_cart_service)],
) -> Cart:
    return carts.add_item(user.id, payload)


@router.patch("/items/{line_id}", response_model=Cart)
def update_item(
    line_id: str,
    payload: UpdateItemRequest,
    user: CurrentUserDep,
    carts: Annotated[CartService, Depends(get_cart_service)],
) -> Cart:
    return carts.update_item(user.id, line_id, payload)


@router.delete("/items/{line_id}", response_model=Cart)
def remove_item(
    line_id: str,
    user: CurrentUserDep,
    carts: Annotated[CartService, Depends(get_cart_service)],
) -> Cart:
    return carts.remove_item(user.id, line_id)


@router.delete("", response_model=Cart)
def clear_cart(
    user: CurrentUserDep,
    carts: Annotated[CartService, Depends(get_cart_service)],
) -> Cart:
    return carts.clear(user.id)

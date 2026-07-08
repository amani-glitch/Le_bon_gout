"""Cart service — add/update/remove items with server-side pricing."""
from __future__ import annotations

from typing import Any

from app.core.exceptions import NotFoundError
from app.repositories.cart_repo import CartRepository
from app.schemas.cart import AddItemRequest, Cart, CartItem, UpdateItemRequest
from app.services.product_service import ProductService
from app.utils.ids import new_id


class CartService:
    def __init__(self, carts: CartRepository, products: ProductService) -> None:
        self._carts = carts
        self._products = products

    def get_cart(self, user_id: str) -> Cart:
        return Cart.model_validate(self._carts.get_or_empty(user_id))

    def add_item(self, user_id: str, payload: AddItemRequest) -> Cart:
        selection = self._products.resolve_selection(
            payload.product_id, payload.size_id, payload.topping_ids
        )
        item = CartItem(
            line_id=new_id("line"),
            product_id=selection.product.id,
            name=selection.product.name,
            image_url=selection.product.image_url,
            size_id=selection.size.id,
            size_name=selection.size.name,
            toppings=selection.toppings,
            quantity=payload.quantity,
            unit_price_cents=selection.unit_price_cents,
            line_total_cents=selection.unit_price_cents * payload.quantity,
            notes=payload.notes,
        )
        cart = self._carts.get_or_empty(user_id)
        cart["items"].append(item.model_dump())
        return self._recalculate_and_save(user_id, cart)

    def update_item(
        self, user_id: str, line_id: str, payload: UpdateItemRequest
    ) -> Cart:
        cart = self._carts.get_or_empty(user_id)
        line = self._find_line(cart, line_id)

        # Re-price if size/toppings changed.
        if payload.size_id is not None or payload.topping_ids is not None:
            selection = self._products.resolve_selection(
                line["product_id"],
                payload.size_id or line["size_id"],
                payload.topping_ids
                if payload.topping_ids is not None
                else [t["id"] for t in line["toppings"]],
            )
            line["size_id"] = selection.size.id
            line["size_name"] = selection.size.name
            line["toppings"] = [t.model_dump() for t in selection.toppings]
            line["unit_price_cents"] = selection.unit_price_cents

        if payload.quantity is not None:
            line["quantity"] = payload.quantity
        if payload.notes is not None:
            line["notes"] = payload.notes

        line["line_total_cents"] = line["unit_price_cents"] * line["quantity"]
        return self._recalculate_and_save(user_id, cart)

    def remove_item(self, user_id: str, line_id: str) -> Cart:
        cart = self._carts.get_or_empty(user_id)
        before = len(cart["items"])
        cart["items"] = [i for i in cart["items"] if i["line_id"] != line_id]
        if len(cart["items"]) == before:
            raise NotFoundError("Cart item not found.")
        return self._recalculate_and_save(user_id, cart)

    def clear(self, user_id: str) -> Cart:
        return Cart.model_validate(self._carts.clear(user_id))

    # ── internals ─────────────────────────────────────────────────
    def _find_line(self, cart: dict[str, Any], line_id: str) -> dict[str, Any]:
        line = next((i for i in cart["items"] if i["line_id"] == line_id), None)
        if line is None:
            raise NotFoundError("Cart item not found.")
        return line

    def _recalculate_and_save(self, user_id: str, cart: dict[str, Any]) -> Cart:
        cart["subtotal_cents"] = sum(i["line_total_cents"] for i in cart["items"])
        return Cart.model_validate(self._carts.save(user_id, cart))

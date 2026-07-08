"""Unit tests for the bot tool executor — name resolution, cart, ordering, auth.

The Gemini network calls (BotAgent / live bridge) are thin glue and not tested
here; ``BotToolExecutor`` is the behavioural seam and is exercised directly
against the in-memory fakes from ``conftest``.
"""
from __future__ import annotations

from app.bot.tools import BotToolExecutor
from app.core.config import Settings
from app.enums import UserRole
from app.schemas.auth import CurrentUser
from app.services.cart_service import CartService
from app.services.order_service import OrderService
from app.services.product_service import ProductService
from app.services.user_service import UserService
from tests.conftest import (
    FakeCartRepo,
    FakeCategoryRepo,
    FakeOrderRepo,
    FakeProductRepo,
)


class FakeUserRepo:
    def __init__(self, user: dict) -> None:
        self._user = user

    def get(self, uid: str) -> dict | None:
        return self._user if uid == self._user["id"] else None

    def update(self, uid: str, data: dict) -> dict:
        self._user.update(data)
        return self._user


def _settings() -> Settings:
    return Settings(
        google_client_id="x",
        google_client_secret="x",
        stripe_secret_key="sk_test",
        stripe_webhook_secret="whsec",
        jwt_secret="secret",
        delivery_fee_cents=299,
    )


def _executor(margherita: dict, *, signed_in: bool = True) -> BotToolExecutor:
    products = ProductService(
        FakeProductRepo({margherita["id"]: margherita}), FakeCategoryRepo()
    )
    carts = CartService(FakeCartRepo(), products)

    class _NoPayment:
        pass

    orders = OrderService(FakeOrderRepo(), carts, _NoPayment(), _settings())  # type: ignore[arg-type]
    user_doc = {
        "id": "user1",
        "email": "u@e.com",
        "display_name": "Ada",
        "addresses": [
            {"id": "a1", "label": "Home", "line1": "1 St", "city": "London",
             "postcode": "E1", "is_default": True}
        ],
    }
    users = UserService(FakeUserRepo(user_doc))  # type: ignore[arg-type]
    current = (
        CurrentUser(id="user1", email="u@e.com", role=UserRole.customer)
        if signed_in
        else None
    )
    return BotToolExecutor(
        products=products, carts=carts, orders=orders, users=users, current_user=current
    )


def test_list_menu_is_public(margherita: dict) -> None:
    ex = _executor(margherita, signed_in=False)
    result = ex.dispatch("list_menu", {})
    assert result["count"] == 1
    assert result["items"][0]["name"] == "Margherita"


def test_get_product_resolves_by_name(margherita: dict) -> None:
    ex = _executor(margherita)
    result = ex.dispatch("get_product", {"query": "margherita"})
    assert result["name"] == "Margherita"
    assert {s["name"] for s in result["sizes"]} == {"Small", "Large"}


def test_add_to_cart_resolves_size_and_topping(margherita: dict) -> None:
    ex = _executor(margherita)
    result = ex.dispatch(
        "add_to_cart",
        {"product": "Margherita", "size": "Large", "toppings": ["Mushrooms"]},
    )
    assert result["ok"] is True
    cart = result["cart"]
    assert cart["item_count"] == 1
    # Large 1499 + mushrooms 100 = 1599
    assert cart["subtotal"] == "£15.99"


def test_add_to_cart_requires_sign_in(margherita: dict) -> None:
    ex = _executor(margherita, signed_in=False)
    result = ex.dispatch("add_to_cart", {"product": "Margherita", "size": "Small"})
    assert "sign in" in result["error"].lower()


def test_add_to_cart_unknown_product(margherita: dict) -> None:
    ex = _executor(margherita)
    result = ex.dispatch("add_to_cart", {"product": "Hawaiian", "size": "Large"})
    assert "couldn't find" in result["error"].lower()


def test_place_order_card_hands_off(margherita: dict) -> None:
    ex = _executor(margherita)
    ex.dispatch("add_to_cart", {"product": "Margherita", "size": "Small"})
    result = ex.dispatch(
        "place_order",
        {"fulfillment_type": "delivery", "payment_method": "card"},
    )
    assert result["action"] == "handoff_checkout"


def test_place_order_cash_needs_confirmation_then_places(margherita: dict) -> None:
    ex = _executor(margherita)
    ex.dispatch("add_to_cart", {"product": "Margherita", "size": "Small"})

    pending = ex.dispatch(
        "place_order",
        {"fulfillment_type": "pickup", "payment_method": "cash"},
    )
    assert pending["needs_confirmation"] is True

    placed = ex.dispatch(
        "place_order",
        {"fulfillment_type": "pickup", "payment_method": "cash", "confirm": True},
    )
    assert placed["ok"] is True
    assert placed["order_id"]
    assert placed["fulfillment"] == "pickup"


def test_place_order_empty_cart(margherita: dict) -> None:
    ex = _executor(margherita)
    result = ex.dispatch(
        "place_order",
        {"fulfillment_type": "pickup", "payment_method": "cash", "confirm": True},
    )
    assert "empty" in result["error"].lower()

"""Unit tests for product pricing, cart recalculation and order lifecycle."""
from __future__ import annotations

import pytest

from app.core.config import Settings
from app.core.exceptions import ConflictError, ValidationError
from app.enums import FulfillmentType, OrderStatus, PaymentMethod, PaymentStatus
from app.schemas.cart import AddItemRequest
from app.schemas.order import CheckoutRequest, OrderStatusUpdate
from app.schemas.user import Address, User
from app.services.cart_service import CartService
from app.services.order_service import OrderService
from app.services.product_service import ProductService
from tests.conftest import (
    FakeCartRepo,
    FakeCategoryRepo,
    FakeOrderRepo,
    FakeProductRepo,
)


def _product_service(margherita: dict) -> ProductService:
    return ProductService(
        FakeProductRepo({margherita["id"]: margherita}), FakeCategoryRepo()
    )


def test_resolve_selection_computes_unit_price(margherita: dict) -> None:
    svc = _product_service(margherita)
    sel = svc.resolve_selection("prod_margherita", "L", ["mushrooms", "olives"])
    # Large 1499 + mushrooms 100 + olives 90 = 1689
    assert sel.unit_price_cents == 1689
    assert {t.id for t in sel.toppings} == {"mushrooms", "olives"}


def test_resolve_selection_rejects_invalid_size(margherita: dict) -> None:
    svc = _product_service(margherita)
    with pytest.raises(ValidationError):
        svc.resolve_selection("prod_margherita", "XXL", [])


def test_resolve_selection_enforces_group_max(margherita: dict) -> None:
    svc = _product_service(margherita)
    with pytest.raises(ValidationError):
        svc.resolve_selection("prod_margherita", "S", ["mushrooms", "olives", "chilli"])


def test_cart_add_and_recalculate(margherita: dict) -> None:
    products = _product_service(margherita)
    carts = CartService(FakeCartRepo(), products)
    cart = carts.add_item(
        "user1",
        AddItemRequest(product_id="prod_margherita", size_id="L", topping_ids=["mushrooms"], quantity=2),
    )
    assert len(cart.items) == 1
    # (1499 + 100) * 2 = 3198
    assert cart.items[0].line_total_cents == 3198
    assert cart.subtotal_cents == 3198


def _order_service(margherita: dict, carts: CartService) -> tuple[OrderService, FakeOrderRepo]:
    settings = Settings(
        google_client_id="x",
        google_client_secret="x",
        stripe_secret_key="sk_test",
        stripe_webhook_secret="whsec",
        jwt_secret="secret",
        delivery_fee_cents=299,
    )

    class _NoPayment:
        pass

    order_repo = FakeOrderRepo()
    return OrderService(order_repo, carts, _NoPayment(), settings), order_repo  # type: ignore[arg-type]


def test_checkout_cash_creates_unpaid_order(margherita: dict) -> None:
    products = _product_service(margherita)
    carts = CartService(FakeCartRepo(), products)
    carts.add_item(
        "user1",
        AddItemRequest(product_id="prod_margherita", size_id="S", topping_ids=[], quantity=1),
    )
    orders, _ = _order_service(margherita, carts)
    user = User(id="user1", email="u@e.com", display_name="U")
    result = orders.checkout(
        user,
        CheckoutRequest(
            payment_method=PaymentMethod.cash_on_delivery,
            fulfillment_type=FulfillmentType.delivery,
            address=Address(
                id="a1", label="Home", line1="1 St", city="London", postcode="E1"
            ),
        ),
    )
    # 899 + 299 delivery = 1198
    assert result.order.total_cents == 1198
    assert result.order.payment.status == PaymentStatus.unpaid
    assert result.client_secret is None
    # cart cleared after checkout
    assert carts.get_cart("user1").items == []


def test_invalid_status_transition_is_rejected(margherita: dict) -> None:
    products = _product_service(margherita)
    carts = CartService(FakeCartRepo(), products)
    carts.add_item(
        "user1",
        AddItemRequest(product_id="prod_margherita", size_id="S", topping_ids=[], quantity=1),
    )
    orders, _ = _order_service(margherita, carts)
    user = User(id="user1", email="u@e.com", display_name="U")
    result = orders.checkout(
        user,
        CheckoutRequest(
            payment_method=PaymentMethod.cash_on_delivery,
            fulfillment_type=FulfillmentType.pickup,
        ),
    )
    oid = result.order.id
    # pending -> delivered is not a legal jump
    with pytest.raises(ConflictError):
        orders.update_status(oid, OrderStatusUpdate(status=OrderStatus.delivered), by="admin")
    # pending -> confirmed is legal
    updated = orders.update_status(
        oid, OrderStatusUpdate(status=OrderStatus.confirmed), by="admin"
    )
    assert updated.status == OrderStatus.confirmed

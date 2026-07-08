"""Order service — checkout, lifecycle transitions, history and webhook reconciliation."""
from __future__ import annotations

from typing import Any

from app.core.config import Settings
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.enums import (
    ORDER_STATUS_FLOW,
    TERMINAL_ORDER_STATUSES,
    FulfillmentType,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
)
from app.repositories.order_repo import OrderRepository
from app.schemas.auth import CurrentUser
from app.schemas.order import (
    CheckoutRequest,
    CheckoutResponse,
    Order,
    OrderStatusUpdate,
)
from app.schemas.user import User
from app.services.cart_service import CartService
from app.services.payment_service import PaymentService
from app.utils.ids import new_order_id


class OrderService:
    def __init__(
        self,
        orders: OrderRepository,
        carts: CartService,
        payments: PaymentService,
        settings: Settings,
    ) -> None:
        self._orders = orders
        self._carts = carts
        self._payments = payments
        self._settings = settings

    def checkout(self, user: User, payload: CheckoutRequest) -> CheckoutResponse:
        cart = self._carts.get_cart(user.id)
        if not cart.items:
            raise ValidationError("Your cart is empty.")

        if payload.fulfillment_type == FulfillmentType.delivery and payload.address is None:
            raise ValidationError("A delivery address is required for delivery orders.")

        delivery_fee = (
            self._settings.delivery_fee_cents
            if payload.fulfillment_type == FulfillmentType.delivery
            else 0
        )
        subtotal = cart.subtotal_cents
        total = subtotal + delivery_fee

        order_id = new_order_id()
        now = self._orders.now()
        is_online = payload.payment_method == PaymentMethod.online

        order_doc: dict[str, Any] = {
            "user_id": user.id,
            "customer_email": user.email,
            "customer_name": user.display_name,
            "items": [item.model_dump() for item in cart.items],
            "subtotal_cents": subtotal,
            "delivery_fee_cents": delivery_fee,
            "total_cents": total,
            "fulfillment": {
                "type": payload.fulfillment_type.value,
                "address": payload.address.model_dump() if payload.address else None,
            },
            "status": OrderStatus.pending.value,
            "payment": {
                "method": payload.payment_method.value,
                "status": (
                    PaymentStatus.pending.value if is_online else PaymentStatus.unpaid.value
                ),
                "stripe_payment_intent_id": None,
                "amount_paid_cents": 0,
            },
            "status_history": [
                {"status": OrderStatus.pending.value, "at": now, "by": "system"}
            ],
            "notes": payload.notes,
            "created_at": now,
            "updated_at": now,
        }

        client_secret: str | None = None
        if is_online:
            intent = self._payments.create_payment_intent(
                order_id=order_id, user_id=user.id, amount_cents=total
            )
            order_doc["payment"]["stripe_payment_intent_id"] = intent.id
            client_secret = intent.client_secret

        created = self._orders.create(order_id, order_doc)
        # Empty the cart now that it has been captured into the order.
        self._carts.clear(user.id)
        return CheckoutResponse(
            order=Order.model_validate(created), client_secret=client_secret
        )

    def list_for_user(
        self, user_id: str, *, limit: int, cursor: str | None
    ) -> tuple[list[Order], str | None]:
        items, next_cursor = self._orders.list_for_user(user_id, limit=limit, cursor=cursor)
        return [Order.model_validate(i) for i in items], next_cursor

    def get_for_user(self, user: CurrentUser, order_id: str) -> Order:
        data = self._orders.get(order_id)
        if not data:
            raise NotFoundError("Order not found.")
        if data.get("user_id") != user.id:
            raise ForbiddenError("You do not have access to this order.")
        return Order.model_validate(data)

    def cancel_own(self, user: CurrentUser, order_id: str) -> Order:
        data = self._orders.get(order_id)
        if not data or data.get("user_id") != user.id:
            raise NotFoundError("Order not found.")
        if data["status"] != OrderStatus.pending.value:
            raise ConflictError("Only pending orders can be cancelled.")
        return self._apply_status(order_id, data, OrderStatus.cancelled, by=user.email)

    # ── Admin ─────────────────────────────────────────────────────
    def list_admin(
        self, *, status: str | None, limit: int, cursor: str | None
    ) -> tuple[list[Order], str | None]:
        items, next_cursor = self._orders.list_admin(status=status, limit=limit, cursor=cursor)
        return [Order.model_validate(i) for i in items], next_cursor

    def get_admin(self, order_id: str) -> Order:
        data = self._orders.get(order_id)
        if not data:
            raise NotFoundError("Order not found.")
        return Order.model_validate(data)

    def update_status(
        self, order_id: str, payload: OrderStatusUpdate, *, by: str
    ) -> Order:
        data = self._orders.get(order_id)
        if not data:
            raise NotFoundError("Order not found.")
        current = OrderStatus(data["status"])
        target = payload.status

        if target != current:
            if current in TERMINAL_ORDER_STATUSES:
                raise ConflictError(f"Order is already {current.value}.")
            if target not in ORDER_STATUS_FLOW.get(current, set()):
                raise ConflictError(
                    f"Cannot move order from {current.value} to {target.value}."
                )

        update: dict[str, Any] = {}
        if payload.payment_status is not None:
            payment = data.get("payment", {})
            payment["status"] = payload.payment_status.value
            if payload.payment_status == PaymentStatus.paid:
                payment["amount_paid_cents"] = data.get("total_cents", 0)
            update["payment"] = payment

        return self._apply_status(order_id, data, target, by=by, extra=update)

    # ── Stripe webhook reconciliation ─────────────────────────────
    def mark_paid_from_intent(self, payment_intent_id: str, amount_received: int) -> None:
        data = self._orders.find_by_payment_intent(payment_intent_id)
        if not data or data.get("payment", {}).get("status") == PaymentStatus.paid.value:
            return
        payment = data.get("payment", {})
        payment.update(status=PaymentStatus.paid.value, amount_paid_cents=amount_received)
        self._apply_status(
            data["id"], data, OrderStatus.confirmed, by="stripe", extra={"payment": payment}
        )

    def mark_payment_status_from_intent(
        self, payment_intent_id: str, status: PaymentStatus
    ) -> None:
        data = self._orders.find_by_payment_intent(payment_intent_id)
        if not data:
            return
        payment = data.get("payment", {})
        if payment.get("status") == status.value:
            return
        payment["status"] = status.value
        self._orders.update(data["id"], {"payment": payment})

    # ── internal ──────────────────────────────────────────────────
    def _apply_status(
        self,
        order_id: str,
        data: dict[str, Any],
        target: OrderStatus,
        *,
        by: str,
        extra: dict[str, Any] | None = None,
    ) -> Order:
        now = self._orders.now()
        history = data.get("status_history", [])
        if not history or history[-1].get("status") != target.value:
            history.append({"status": target.value, "at": now, "by": by})
        update: dict[str, Any] = {"status": target.value, "status_history": history}
        if extra:
            update.update(extra)
        return Order.model_validate(self._orders.update(order_id, update))

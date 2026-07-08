"""Order schemas — checkout request, order resource and admin updates."""
from __future__ import annotations

from datetime import datetime

from pydantic import Field, NonNegativeInt

from app.enums import FulfillmentType, OrderStatus, PaymentMethod, PaymentStatus
from app.schemas.cart import CartItem
from app.schemas.common import ApiModel
from app.schemas.user import Address


class Fulfillment(ApiModel):
    type: FulfillmentType
    address: Address | None = None


class PaymentInfo(ApiModel):
    method: PaymentMethod
    status: PaymentStatus
    stripe_payment_intent_id: str | None = None
    amount_paid_cents: NonNegativeInt = 0


class StatusEvent(ApiModel):
    status: OrderStatus
    at: datetime | None = None
    by: str = "system"


class Order(ApiModel):
    id: str
    user_id: str
    customer_email: str
    customer_name: str
    items: list[CartItem]
    subtotal_cents: NonNegativeInt
    delivery_fee_cents: NonNegativeInt
    total_cents: NonNegativeInt
    fulfillment: Fulfillment
    status: OrderStatus
    payment: PaymentInfo
    status_history: list[StatusEvent] = Field(default_factory=list)
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class CheckoutRequest(ApiModel):
    payment_method: PaymentMethod
    fulfillment_type: FulfillmentType = FulfillmentType.delivery
    address: Address | None = None
    notes: str | None = Field(default=None, max_length=400)


class CheckoutResponse(ApiModel):
    """Returned from POST /orders. ``client_secret`` is set only for online pay."""

    order: Order
    client_secret: str | None = None


class OrderStatusUpdate(ApiModel):
    status: OrderStatus
    payment_status: PaymentStatus | None = None

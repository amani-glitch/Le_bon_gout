"""Domain enumerations shared across schemas, services and repositories."""
from __future__ import annotations

from enum import Enum


class UserRole(str, Enum):
    customer = "customer"
    admin = "admin"


class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    preparing = "preparing"
    ready = "ready"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"


# Allowed forward transitions for admin status updates. ``cancelled`` is
# reachable from any non-terminal state and handled separately.
ORDER_STATUS_FLOW: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.pending: {OrderStatus.confirmed, OrderStatus.preparing, OrderStatus.cancelled},
    OrderStatus.confirmed: {OrderStatus.preparing, OrderStatus.cancelled},
    OrderStatus.preparing: {OrderStatus.ready, OrderStatus.out_for_delivery, OrderStatus.cancelled},
    OrderStatus.ready: {OrderStatus.out_for_delivery, OrderStatus.completed, OrderStatus.cancelled},
    OrderStatus.out_for_delivery: {OrderStatus.delivered, OrderStatus.cancelled},
    OrderStatus.delivered: {OrderStatus.completed},
    OrderStatus.completed: set(),
    OrderStatus.cancelled: set(),
}

TERMINAL_ORDER_STATUSES = {OrderStatus.completed, OrderStatus.cancelled}


class PaymentStatus(str, Enum):
    unpaid = "unpaid"
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class PaymentMethod(str, Enum):
    online = "online"
    cash_on_delivery = "cash_on_delivery"


class FulfillmentType(str, Enum):
    delivery = "delivery"
    pickup = "pickup"

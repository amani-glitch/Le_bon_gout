"""Metrics service — admin dashboard aggregations.

Firestore lacks server-side aggregation for these shapes, so we read the
orders collection and compute in-memory. Fine for the platform's scale; revisit
with scheduled rollups if order volume grows large.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import UTC, datetime

from app.enums import OrderStatus, PaymentStatus
from app.repositories.order_repo import OrderRepository
from app.repositories.user_repo import UserRepository
from app.schemas.metrics import DashboardMetrics, StatusCount, TopProduct

ACTIVE_STATUSES = {
    OrderStatus.pending.value,
    OrderStatus.confirmed.value,
    OrderStatus.preparing.value,
    OrderStatus.ready.value,
    OrderStatus.out_for_delivery.value,
}


class MetricsService:
    def __init__(self, orders: OrderRepository, users: UserRepository) -> None:
        self._orders = orders
        self._users = users

    def dashboard(self) -> DashboardMetrics:
        orders = self._orders.all()
        today = datetime.now(UTC).date()

        status_counter: Counter[str] = Counter()
        product_qty: dict[str, int] = defaultdict(int)
        product_name: dict[str, str] = {}
        orders_today = 0
        revenue_today = 0
        revenue_total = 0
        active = 0

        for order in orders:
            status = order.get("status", "")
            status_counter[status] += 1
            if status in ACTIVE_STATUSES:
                active += 1

            paid = order.get("payment", {}).get("status") == PaymentStatus.paid.value
            total = order.get("total_cents", 0)
            if paid:
                revenue_total += total

            created = order.get("created_at")
            created_date = created.date() if isinstance(created, datetime) else None
            if created_date == today:
                orders_today += 1
                if paid:
                    revenue_today += total

            for item in order.get("items", []):
                pid = item.get("product_id", "")
                product_qty[pid] += item.get("quantity", 0)
                product_name[pid] = item.get("name", pid)

        top = sorted(product_qty.items(), key=lambda kv: kv[1], reverse=True)[:5]

        return DashboardMetrics(
            orders_today=orders_today,
            revenue_today_cents=revenue_today,
            active_orders=active,
            total_orders=len(orders),
            total_customers=len(self._users.list()),
            orders_by_status=[
                StatusCount(status=s, count=c) for s, c in status_counter.items()
            ],
            top_products=[
                TopProduct(product_id=pid, name=product_name.get(pid, pid), quantity=qty)
                for pid, qty in top
            ],
            revenue_total_cents=revenue_total,
        )

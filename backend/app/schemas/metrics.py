"""Admin dashboard metric schemas."""
from __future__ import annotations

from app.schemas.common import ApiModel


class StatusCount(ApiModel):
    status: str
    count: int


class TopProduct(ApiModel):
    product_id: str
    name: str
    quantity: int


class DashboardMetrics(ApiModel):
    orders_today: int
    revenue_today_cents: int
    active_orders: int
    total_orders: int
    total_customers: int
    orders_by_status: list[StatusCount]
    top_products: list[TopProduct]
    revenue_total_cents: int

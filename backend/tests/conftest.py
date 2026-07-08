"""In-memory fakes so services can be unit-tested without Firestore."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import pytest


class FakeProductRepo:
    def __init__(self, products: dict[str, dict]) -> None:
        self._data = products

    @staticmethod
    def now() -> datetime:
        return datetime.now(UTC)

    def get(self, pid: str) -> dict | None:
        return self._data.get(pid)

    def query(self, *, category: str | None = None, active_only: bool = False) -> list[dict]:
        rows = list(self._data.values())
        if category:
            rows = [r for r in rows if r.get("category") == category]
        if active_only:
            rows = [r for r in rows if r.get("is_active", True)]
        return rows

    def set(self, pid: str, data: dict) -> dict:
        self._data[pid] = {**data, "id": pid}
        return self._data[pid]

    def update(self, pid: str, data: dict) -> dict:
        self._data[pid].update(data)
        return self._data[pid]


class FakeCategoryRepo:
    def list_sorted(self, *, active_only: bool = False) -> list[dict]:
        return []


class FakeCartRepo:
    def __init__(self) -> None:
        self._carts: dict[str, dict] = {}

    @staticmethod
    def now() -> datetime:
        return datetime.now(UTC)

    def get_or_empty(self, user_id: str) -> dict[str, Any]:
        return self._carts.get(
            user_id, {"id": user_id, "user_id": user_id, "items": [], "subtotal_cents": 0}
        )

    def save(self, user_id: str, cart: dict) -> dict:
        self._carts[user_id] = {**cart, "user_id": user_id}
        return self._carts[user_id]

    def clear(self, user_id: str) -> dict:
        return self.save(user_id, {"items": [], "subtotal_cents": 0})


class FakeOrderRepo:
    def __init__(self) -> None:
        self._orders: dict[str, dict] = {}

    @staticmethod
    def now() -> datetime:
        return datetime.now(UTC)

    def create(self, oid: str, data: dict) -> dict:
        self._orders[oid] = {**data, "id": oid}
        return self._orders[oid]

    def get(self, oid: str) -> dict | None:
        return self._orders.get(oid)

    def update(self, oid: str, data: dict) -> dict:
        self._orders[oid].update(data)
        return self._orders[oid]


@pytest.fixture
def margherita() -> dict:
    return {
        "id": "prod_margherita",
        "name": "Margherita",
        "category": "pizza",
        "is_active": True,
        "image_url": None,
        "base_price_cents": 899,
        "sizes": [
            {"id": "S", "name": "Small", "price_cents": 899},
            {"id": "L", "name": "Large", "price_cents": 1499},
        ],
        "topping_groups": [
            {
                "id": "extras",
                "name": "Extras",
                "min": 0,
                "max": 2,
                "multi_select": True,
                "options": [
                    {"id": "mushrooms", "name": "Mushrooms", "price_cents": 100},
                    {"id": "olives", "name": "Olives", "price_cents": 90},
                    {"id": "chilli", "name": "Chilli", "price_cents": 80},
                ],
            }
        ],
        "sort_order": 1,
    }

"""Cart repository — one document per user keyed by user id."""
from __future__ import annotations

from typing import Any

from google.cloud import firestore

from app.repositories.base import BaseRepository


class CartRepository(BaseRepository):
    def __init__(self, db: firestore.Client) -> None:
        super().__init__(db, "carts")

    def get_or_empty(self, user_id: str) -> dict[str, Any]:
        existing = self.get(user_id)
        if existing:
            return existing
        return {"id": user_id, "user_id": user_id, "items": [], "subtotal_cents": 0}

    def save(self, user_id: str, cart: dict[str, Any]) -> dict[str, Any]:
        cart = {**cart, "user_id": user_id, "updated_at": self.now()}
        return self.set(user_id, cart, merge=False)

    def clear(self, user_id: str) -> dict[str, Any]:
        return self.save(user_id, {"items": [], "subtotal_cents": 0})

"""Order repository.

Order lists use a single equality filter in Firestore (no composite index
required) and sort/paginate in memory. This keeps the project index-free at the
cost of reading the matching set; fine at this scale. If order volume grows,
deploy the composite indexes in ``firestore.indexes.json`` and switch the
queries back to a server-side ``order_by`` + cursor.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from google.cloud import firestore

from app.repositories.base import BaseRepository


class OrderRepository(BaseRepository):
    def __init__(self, db: firestore.Client) -> None:
        super().__init__(db, "orders")

    def create(self, order_id: str, data: dict[str, Any]) -> dict[str, Any]:
        return self.set(order_id, data, merge=False)

    def list_for_user(
        self, user_id: str, *, limit: int = 50, cursor: str | None = None
    ) -> tuple[list[dict[str, Any]], str | None]:
        docs = [
            self._with_id(d)
            for d in self.collection.where(
                filter=firestore.FieldFilter("user_id", "==", user_id)
            ).stream()
            if d.exists
        ]
        return self._sort_and_paginate(docs, limit, cursor)  # type: ignore[arg-type]

    def list_admin(
        self,
        *,
        status: str | None = None,
        limit: int = 50,
        cursor: str | None = None,
    ) -> tuple[list[dict[str, Any]], str | None]:
        query: firestore.Query | firestore.CollectionReference = self.collection
        if status:
            query = query.where(filter=firestore.FieldFilter("status", "==", status))
        docs = [self._with_id(d) for d in query.stream() if d.exists]
        return self._sort_and_paginate(docs, limit, cursor)  # type: ignore[arg-type]

    def find_by_payment_intent(self, payment_intent_id: str) -> dict[str, Any] | None:
        docs = list(
            self.collection.where(
                filter=firestore.FieldFilter(
                    "payment.stripe_payment_intent_id", "==", payment_intent_id
                )
            ).limit(1).stream()
        )
        return self._with_id(docs[0]) if docs else None

    def all(self) -> list[dict[str, Any]]:
        return self.list()

    @staticmethod
    def _created_key(doc: dict[str, Any]) -> float:
        created = doc.get("created_at")
        return created.timestamp() if isinstance(created, datetime) else 0.0

    def _sort_and_paginate(
        self, docs: list[dict[str, Any]], limit: int, cursor: str | None
    ) -> tuple[list[dict[str, Any]], str | None]:
        docs.sort(key=self._created_key, reverse=True)  # newest first
        start = 0
        if cursor:
            idx = next((i for i, d in enumerate(docs) if d["id"] == cursor), None)
            if idx is not None:
                start = idx + 1
        window = docs[start : start + limit]
        next_cursor = window[-1]["id"] if len(docs) > start + limit and window else None
        return window, next_cursor

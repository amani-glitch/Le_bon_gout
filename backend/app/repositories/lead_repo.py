"""Lead repository — persists B2B leads in the ``botler_pizza_leads`` collection.

Listing sorts/paginates in memory (index-free), mirroring
``BotConversationRepository`` — fine at this platform's scale.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from google.cloud import firestore

from app.repositories.base import BaseRepository


class LeadRepository(BaseRepository):
    def __init__(self, db: firestore.Client) -> None:
        super().__init__(db, "botler_pizza_leads")

    def create(self, lead_id: str, data: dict[str, Any]) -> dict[str, Any]:
        return self.set(lead_id, data, merge=False)

    def list_admin(
        self,
        *,
        status: str | None = None,
        limit: int = 25,
        cursor: str | None = None,
    ) -> tuple[list[dict[str, Any]], str | None]:
        query: firestore.Query | firestore.CollectionReference = self.collection
        if status:
            query = query.where(filter=firestore.FieldFilter("status", "==", status))
        docs = [self._with_id(d) for d in query.stream() if d.exists]
        return self._sort_and_paginate(docs, limit, cursor)  # type: ignore[arg-type]

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

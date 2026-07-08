"""User repository."""
from __future__ import annotations

from typing import Any

from google.cloud import firestore

from app.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    def __init__(self, db: firestore.Client) -> None:
        super().__init__(db, "users")

    def list_paginated(
        self, *, limit: int, cursor: str | None = None, search: str | None = None
    ) -> tuple[list[dict[str, Any]], str | None]:
        query = self.collection.order_by("created_at", direction=firestore.Query.DESCENDING)
        if cursor:
            snap = self.collection.document(cursor).get()
            if snap.exists:
                query = query.start_after(snap)
        docs = list(query.limit(limit + 1).stream())
        items = [self._with_id(d) for d in docs[:limit]]
        # Lightweight in-memory search (email/name) over the page.
        if search:
            needle = search.lower()
            items = [
                i
                for i in items
                if needle in (i.get("email", "").lower())
                or needle in (i.get("display_name", "").lower())
            ]
        next_cursor = docs[limit].id if len(docs) > limit else None
        return items, next_cursor  # type: ignore[return-value]

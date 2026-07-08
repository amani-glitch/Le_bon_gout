"""Product and category repositories."""
from __future__ import annotations

from typing import Any

from google.cloud import firestore

from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository):
    def __init__(self, db: firestore.Client) -> None:
        super().__init__(db, "products")

    def query(
        self, *, category: str | None = None, active_only: bool = False
    ) -> list[dict[str, Any]]:
        query: firestore.Query | firestore.CollectionReference = self.collection
        if category:
            query = query.where(filter=firestore.FieldFilter("category", "==", category))
        if active_only:
            query = query.where(filter=firestore.FieldFilter("is_active", "==", True))
        docs = [self._with_id(d) for d in query.stream() if d.exists]
        return sorted(docs, key=lambda d: (d.get("sort_order", 0), d.get("name", "")))  # type: ignore[union-attr]


class CategoryRepository(BaseRepository):
    def __init__(self, db: firestore.Client) -> None:
        super().__init__(db, "categories")

    def list_sorted(self, *, active_only: bool = False) -> list[dict[str, Any]]:
        docs = self.list()
        if active_only:
            docs = [d for d in docs if d.get("is_active", True)]
        return sorted(docs, key=lambda d: (d.get("sort_order", 0), d.get("name", "")))

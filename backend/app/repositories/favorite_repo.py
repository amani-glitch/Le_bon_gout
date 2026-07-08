"""Favorite repository — subcollection ``favorites/{userId}/items``."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from google.cloud import firestore


class FavoriteRepository:
    def __init__(self, db: firestore.Client) -> None:
        self._db = db

    def _items(self, user_id: str) -> firestore.CollectionReference:
        return self._db.collection("favorites").document(user_id).collection("items")

    def list(self, user_id: str) -> list[dict[str, Any]]:
        docs = []
        for snap in self._items(user_id).order_by(
            "created_at", direction=firestore.Query.DESCENDING
        ).stream():
            data = snap.to_dict() or {}
            data["id"] = snap.id
            docs.append(data)
        return docs

    def get(self, user_id: str, fav_id: str) -> dict[str, Any] | None:
        snap = self._items(user_id).document(fav_id).get()
        if not snap.exists:
            return None
        data = snap.to_dict() or {}
        data["id"] = snap.id
        return data

    def create(self, user_id: str, fav_id: str, data: dict[str, Any]) -> dict[str, Any]:
        payload = {k: v for k, v in data.items() if k != "id"}
        payload.setdefault("created_at", datetime.now(UTC))
        self._items(user_id).document(fav_id).set(payload)
        return self.get(user_id, fav_id)  # type: ignore[return-value]

    def delete(self, user_id: str, fav_id: str) -> None:
        self._items(user_id).document(fav_id).delete()

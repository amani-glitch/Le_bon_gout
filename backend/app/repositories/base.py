"""Generic Firestore repository.

The base encapsulates all direct Firestore access for a single collection.
Concrete repositories subclass it and add query helpers; services depend only
on these repositories (and can be handed fakes in tests).
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from google.cloud import firestore


class BaseRepository:
    """CRUD over one Firestore collection, with id injected onto documents."""

    def __init__(self, db: firestore.Client, collection: str) -> None:
        self._db = db
        self._collection_name = collection

    @property
    def collection(self) -> firestore.CollectionReference:
        return self._db.collection(self._collection_name)

    @staticmethod
    def _with_id(snapshot: firestore.DocumentSnapshot) -> dict[str, Any] | None:
        if not snapshot.exists:
            return None
        data = snapshot.to_dict() or {}
        data["id"] = snapshot.id
        return data

    def get(self, doc_id: str) -> dict[str, Any] | None:
        return self._with_id(self.collection.document(doc_id).get())

    def list(self) -> list[dict[str, Any]]:
        return [self._with_id(doc) for doc in self.collection.stream() if doc.exists]  # type: ignore[misc]

    def set(self, doc_id: str, data: dict[str, Any], *, merge: bool = False) -> dict[str, Any]:
        payload = {k: v for k, v in data.items() if k != "id"}
        self.collection.document(doc_id).set(payload, merge=merge)
        return self.get(doc_id)  # type: ignore[return-value]

    def update(self, doc_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        payload = {k: v for k, v in data.items() if k != "id"}
        payload["updated_at"] = datetime.now(UTC)
        self.collection.document(doc_id).update(payload)
        return self.get(doc_id)

    def delete(self, doc_id: str) -> None:
        self.collection.document(doc_id).delete()

    @staticmethod
    def now() -> datetime:
        return datetime.now(UTC)

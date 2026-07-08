"""Identifier helpers."""
from __future__ import annotations

import uuid

from ulid import ULID


def new_order_id() -> str:
    """Time-sortable order id (ULID), prefixed for readability."""
    return f"ord_{ULID()}"


def new_id(prefix: str = "") -> str:
    """Short random id, optionally prefixed (e.g. ``line``, ``addr``, ``fav``)."""
    token = uuid.uuid4().hex[:12]
    return f"{prefix}_{token}" if prefix else token

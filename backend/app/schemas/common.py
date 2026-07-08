"""Shared schema primitives."""
from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ApiModel(BaseModel):
    """Base model with sane defaults for API payloads."""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class Page(ApiModel, Generic[T]):
    """Cursor-paginated result envelope."""

    items: list[T]
    next_cursor: str | None = None
    has_more: bool = False

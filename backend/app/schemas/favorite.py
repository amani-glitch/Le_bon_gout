"""Favorite (saved customization) schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.schemas.cart import SelectedTopping
from app.schemas.common import ApiModel


class Favorite(ApiModel):
    id: str
    product_id: str
    name: str
    image_url: str | None = None
    size_id: str
    size_name: str
    toppings: list[SelectedTopping] = Field(default_factory=list)
    created_at: datetime | None = None


class FavoriteCreate(ApiModel):
    product_id: str
    size_id: str
    topping_ids: list[str] = Field(default_factory=list)

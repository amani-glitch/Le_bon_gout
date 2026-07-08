"""Cart and cart-item schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import Field, NonNegativeInt, PositiveInt

from app.schemas.common import ApiModel


class SelectedTopping(ApiModel):
    id: str
    name: str
    price_cents: NonNegativeInt = 0


class CartItem(ApiModel):
    """A fully-priced cart line. Names/prices are snapshotted at add-time."""

    line_id: str
    product_id: str
    name: str
    image_url: str | None = None
    size_id: str
    size_name: str
    toppings: list[SelectedTopping] = Field(default_factory=list)
    quantity: PositiveInt
    unit_price_cents: NonNegativeInt
    line_total_cents: NonNegativeInt
    notes: str | None = Field(default=None, max_length=300)


class Cart(ApiModel):
    user_id: str
    items: list[CartItem] = Field(default_factory=list)
    subtotal_cents: NonNegativeInt = 0
    updated_at: datetime | None = None


class AddItemRequest(ApiModel):
    product_id: str
    size_id: str
    topping_ids: list[str] = Field(default_factory=list)
    quantity: PositiveInt = 1
    notes: str | None = Field(default=None, max_length=300)


class UpdateItemRequest(ApiModel):
    quantity: PositiveInt | None = None
    size_id: str | None = None
    topping_ids: list[str] | None = None
    notes: str | None = Field(default=None, max_length=300)

"""Product, size, topping and category schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import Field, NonNegativeInt

from app.schemas.common import ApiModel


class ToppingOption(ApiModel):
    id: str
    name: str = Field(min_length=1, max_length=80)
    price_cents: NonNegativeInt = 0


class ToppingGroup(ApiModel):
    id: str
    name: str = Field(min_length=1, max_length=80)
    min: NonNegativeInt = 0
    max: NonNegativeInt = 0
    multi_select: bool = True
    options: list[ToppingOption] = Field(default_factory=list)


class ProductSize(ApiModel):
    id: str
    name: str = Field(min_length=1, max_length=40)
    price_cents: NonNegativeInt


class Category(ApiModel):
    id: str
    name: str = Field(min_length=1, max_length=80)
    sort_order: int = 0
    is_active: bool = True


class CategoryCreate(ApiModel):
    id: str = Field(min_length=1, max_length=60, pattern=r"^[a-z0-9-]+$")
    name: str = Field(min_length=1, max_length=80)
    sort_order: int = 0
    is_active: bool = True


class CategoryUpdate(ApiModel):
    name: str | None = Field(default=None, max_length=80)
    sort_order: int | None = None
    is_active: bool | None = None


class Product(ApiModel):
    id: str
    name: str
    description: str = ""
    category: str
    image_url: str | None = None
    is_active: bool = True
    base_price_cents: NonNegativeInt
    sizes: list[ProductSize] = Field(default_factory=list)
    topping_groups: list[ToppingGroup] = Field(default_factory=list)
    sort_order: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProductCreate(ApiModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=600)
    category: str = Field(min_length=1, max_length=60)
    image_url: str | None = None
    is_active: bool = True
    base_price_cents: NonNegativeInt
    sizes: list[ProductSize] = Field(default_factory=list)
    topping_groups: list[ToppingGroup] = Field(default_factory=list)
    sort_order: int = 0


class ProductUpdate(ApiModel):
    name: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=600)
    category: str | None = Field(default=None, max_length=60)
    image_url: str | None = None
    is_active: bool | None = None
    base_price_cents: NonNegativeInt | None = None
    sizes: list[ProductSize] | None = None
    topping_groups: list[ToppingGroup] | None = None
    sort_order: int | None = None

"""User, address and preference schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import EmailStr, Field

from app.enums import FulfillmentType, UserRole
from app.schemas.common import ApiModel


class Address(ApiModel):
    id: str
    label: str = Field(min_length=1, max_length=60)
    line1: str = Field(min_length=1, max_length=200)
    line2: str | None = Field(default=None, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    postcode: str = Field(min_length=1, max_length=20)
    phone: str | None = Field(default=None, max_length=30)
    is_default: bool = False


class AddressCreate(ApiModel):
    label: str = Field(min_length=1, max_length=60)
    line1: str = Field(min_length=1, max_length=200)
    line2: str | None = Field(default=None, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    postcode: str = Field(min_length=1, max_length=20)
    phone: str | None = Field(default=None, max_length=30)
    is_default: bool = False


class AddressUpdate(ApiModel):
    label: str | None = Field(default=None, max_length=60)
    line1: str | None = Field(default=None, max_length=200)
    line2: str | None = Field(default=None, max_length=200)
    city: str | None = Field(default=None, max_length=100)
    postcode: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=30)
    is_default: bool | None = None


class Preferences(ApiModel):
    default_fulfillment: FulfillmentType = FulfillmentType.delivery
    marketing_opt_in: bool = False
    dietary: list[str] = Field(default_factory=list)


class User(ApiModel):
    id: str
    email: EmailStr
    display_name: str
    photo_url: str | None = None
    role: UserRole = UserRole.customer
    phone: str | None = None
    addresses: list[Address] = Field(default_factory=list)
    preferences: Preferences = Field(default_factory=Preferences)
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProfileUpdate(ApiModel):
    """Fields a customer is allowed to change on their own profile."""

    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    preferences: Preferences | None = None


class RoleUpdate(ApiModel):
    role: UserRole

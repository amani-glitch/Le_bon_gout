"""User service — profile, preferences, addresses, admin customer management."""
from __future__ import annotations

from typing import Any

from app.core.exceptions import NotFoundError
from app.enums import UserRole
from app.repositories.user_repo import UserRepository
from app.schemas.user import (
    Address,
    AddressCreate,
    AddressUpdate,
    ProfileUpdate,
    User,
)
from app.utils.ids import new_id


class UserService:
    def __init__(self, users: UserRepository) -> None:
        self._users = users

    def _require(self, user_id: str) -> dict[str, Any]:
        data = self._users.get(user_id)
        if not data:
            raise NotFoundError("User not found.")
        return data

    def get(self, user_id: str) -> User:
        return User.model_validate(self._require(user_id))

    def update_profile(self, user_id: str, payload: ProfileUpdate) -> User:
        self._require(user_id)
        update = payload.model_dump(exclude_none=True)
        data = self._users.update(user_id, update)
        return User.model_validate(data)

    # ── Addresses ─────────────────────────────────────────────────
    def list_addresses(self, user_id: str) -> list[Address]:
        data = self._require(user_id)
        return [Address.model_validate(a) for a in data.get("addresses", [])]

    def add_address(self, user_id: str, payload: AddressCreate) -> Address:
        data = self._require(user_id)
        addresses = data.get("addresses", [])
        new_address = payload.model_dump()
        new_address["id"] = new_id("addr")
        if new_address.get("is_default") or not addresses:
            for a in addresses:
                a["is_default"] = False
            new_address["is_default"] = True
        addresses.append(new_address)
        self._users.update(user_id, {"addresses": addresses})
        return Address.model_validate(new_address)

    def update_address(
        self, user_id: str, address_id: str, payload: AddressUpdate
    ) -> Address:
        data = self._require(user_id)
        addresses = data.get("addresses", [])
        target = next((a for a in addresses if a.get("id") == address_id), None)
        if target is None:
            raise NotFoundError("Address not found.")
        changes = payload.model_dump(exclude_none=True)
        target.update(changes)
        if changes.get("is_default"):
            for a in addresses:
                a["is_default"] = a.get("id") == address_id
        self._users.update(user_id, {"addresses": addresses})
        return Address.model_validate(target)

    def delete_address(self, user_id: str, address_id: str) -> None:
        data = self._require(user_id)
        addresses = data.get("addresses", [])
        remaining = [a for a in addresses if a.get("id") != address_id]
        if len(remaining) == len(addresses):
            raise NotFoundError("Address not found.")
        # Keep a default if any remain.
        if remaining and not any(a.get("is_default") for a in remaining):
            remaining[0]["is_default"] = True
        self._users.update(user_id, {"addresses": remaining})

    # ── Admin ─────────────────────────────────────────────────────
    def list_customers(
        self, *, limit: int, cursor: str | None, search: str | None
    ) -> tuple[list[User], str | None]:
        items, next_cursor = self._users.list_paginated(
            limit=limit, cursor=cursor, search=search
        )
        return [User.model_validate(i) for i in items], next_cursor

    def set_role(self, user_id: str, role: UserRole) -> User:
        self._require(user_id)
        data = self._users.update(user_id, {"role": role.value})
        return User.model_validate(data)

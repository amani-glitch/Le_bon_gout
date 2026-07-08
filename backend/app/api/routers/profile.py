"""Profile and address routes (authenticated)."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUserDep, get_user_service
from app.schemas.user import (
    Address,
    AddressCreate,
    AddressUpdate,
    ProfileUpdate,
    User,
)
from app.services.user_service import UserService

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=User)
def get_profile(
    user: CurrentUserDep,
    users: Annotated[UserService, Depends(get_user_service)],
) -> User:
    return users.get(user.id)


@router.patch("", response_model=User)
def update_profile(
    payload: ProfileUpdate,
    user: CurrentUserDep,
    users: Annotated[UserService, Depends(get_user_service)],
) -> User:
    return users.update_profile(user.id, payload)


@router.get("/addresses", response_model=list[Address])
def list_addresses(
    user: CurrentUserDep,
    users: Annotated[UserService, Depends(get_user_service)],
) -> list[Address]:
    return users.list_addresses(user.id)


@router.post("/addresses", response_model=Address)
def add_address(
    payload: AddressCreate,
    user: CurrentUserDep,
    users: Annotated[UserService, Depends(get_user_service)],
) -> Address:
    return users.add_address(user.id, payload)


@router.patch("/addresses/{address_id}", response_model=Address)
def update_address(
    address_id: str,
    payload: AddressUpdate,
    user: CurrentUserDep,
    users: Annotated[UserService, Depends(get_user_service)],
) -> Address:
    return users.update_address(user.id, address_id, payload)


@router.delete("/addresses/{address_id}")
def delete_address(
    address_id: str,
    user: CurrentUserDep,
    users: Annotated[UserService, Depends(get_user_service)],
) -> dict:
    users.delete_address(user.id, address_id)
    return {"ok": True}

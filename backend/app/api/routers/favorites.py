"""Favorite routes (authenticated)."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUserDep, get_favorite_service
from app.schemas.cart import Cart
from app.schemas.favorite import Favorite, FavoriteCreate
from app.services.favorite_service import FavoriteService

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[Favorite])
def list_favorites(
    user: CurrentUserDep,
    favorites: Annotated[FavoriteService, Depends(get_favorite_service)],
) -> list[Favorite]:
    return favorites.list(user.id)


@router.post("", response_model=Favorite)
def add_favorite(
    payload: FavoriteCreate,
    user: CurrentUserDep,
    favorites: Annotated[FavoriteService, Depends(get_favorite_service)],
) -> Favorite:
    return favorites.add(user.id, payload)


@router.delete("/{fav_id}")
def remove_favorite(
    fav_id: str,
    user: CurrentUserDep,
    favorites: Annotated[FavoriteService, Depends(get_favorite_service)],
) -> dict:
    favorites.remove(user.id, fav_id)
    return {"ok": True}


@router.post("/{fav_id}/add-to-cart", response_model=Cart)
def favorite_to_cart(
    fav_id: str,
    user: CurrentUserDep,
    favorites: Annotated[FavoriteService, Depends(get_favorite_service)],
) -> Cart:
    return favorites.add_to_cart(user.id, fav_id)

"""Favorite service — saved customizations and add-to-cart convenience."""
from __future__ import annotations

from app.core.exceptions import NotFoundError
from app.repositories.favorite_repo import FavoriteRepository
from app.schemas.cart import AddItemRequest, Cart
from app.schemas.favorite import Favorite, FavoriteCreate
from app.services.cart_service import CartService
from app.services.product_service import ProductService
from app.utils.ids import new_id


class FavoriteService:
    def __init__(
        self,
        favorites: FavoriteRepository,
        products: ProductService,
        carts: CartService,
    ) -> None:
        self._favorites = favorites
        self._products = products
        self._carts = carts

    def list(self, user_id: str) -> list[Favorite]:
        return [Favorite.model_validate(f) for f in self._favorites.list(user_id)]

    def add(self, user_id: str, payload: FavoriteCreate) -> Favorite:
        selection = self._products.resolve_selection(
            payload.product_id, payload.size_id, payload.topping_ids
        )
        fav_id = new_id("fav")
        data = {
            "product_id": selection.product.id,
            "name": selection.product.name,
            "image_url": selection.product.image_url,
            "size_id": selection.size.id,
            "size_name": selection.size.name,
            "toppings": [t.model_dump() for t in selection.toppings],
        }
        return Favorite.model_validate(self._favorites.create(user_id, fav_id, data))

    def remove(self, user_id: str, fav_id: str) -> None:
        if not self._favorites.get(user_id, fav_id):
            raise NotFoundError("Favorite not found.")
        self._favorites.delete(user_id, fav_id)

    def add_to_cart(self, user_id: str, fav_id: str) -> Cart:
        fav = self._favorites.get(user_id, fav_id)
        if not fav:
            raise NotFoundError("Favorite not found.")
        request = AddItemRequest(
            product_id=fav["product_id"],
            size_id=fav["size_id"],
            topping_ids=[t["id"] for t in fav.get("toppings", [])],
            quantity=1,
        )
        return self._carts.add_item(user_id, request)

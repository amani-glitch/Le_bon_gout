"""Product service — menu browsing, CRUD and price/customization helpers."""
from __future__ import annotations

from typing import Any

from app.core.exceptions import NotFoundError, ValidationError
from app.repositories.product_repo import CategoryRepository, ProductRepository
from app.schemas.cart import SelectedTopping
from app.schemas.product import (
    Category,
    CategoryCreate,
    CategoryUpdate,
    Product,
    ProductCreate,
    ProductSize,
    ProductUpdate,
)
from app.utils.ids import new_id


class PricedSelection:
    """Result of resolving a product + size + toppings into a priced line."""

    def __init__(
        self,
        product: Product,
        size: ProductSize,
        toppings: list[SelectedTopping],
        unit_price_cents: int,
    ) -> None:
        self.product = product
        self.size = size
        self.toppings = toppings
        self.unit_price_cents = unit_price_cents


class ProductService:
    def __init__(self, products: ProductRepository, categories: CategoryRepository) -> None:
        self._products = products
        self._categories = categories

    # ── Public read ───────────────────────────────────────────────
    def list_products(
        self, *, category: str | None = None, active_only: bool = True
    ) -> list[Product]:
        rows = self._products.query(category=category, active_only=active_only)
        return [Product.model_validate(r) for r in rows]

    def get_product(self, product_id: str, *, require_active: bool = False) -> Product:
        data = self._products.get(product_id)
        if not data or (require_active and not data.get("is_active", True)):
            raise NotFoundError("Product not found.")
        return Product.model_validate(data)

    def list_categories(self, *, active_only: bool = True) -> list[Category]:
        rows = self._categories.list_sorted(active_only=active_only)
        return [Category.model_validate(r) for r in rows]

    # ── Pricing / customization ───────────────────────────────────
    def resolve_selection(
        self, product_id: str, size_id: str, topping_ids: list[str]
    ) -> PricedSelection:
        """Validate a customization against the live product and compute its unit price."""
        product = self.get_product(product_id, require_active=True)

        size = next((s for s in product.sizes if s.id == size_id), None)
        if size is None:
            raise ValidationError(f"Invalid size '{size_id}' for this product.")

        selected: list[SelectedTopping] = []
        option_by_id = {
            opt.id: opt for group in product.topping_groups for opt in group.options
        }
        for tid in topping_ids:
            opt = option_by_id.get(tid)
            if opt is None:
                raise ValidationError(f"Invalid topping '{tid}' for this product.")
            selected.append(
                SelectedTopping(id=opt.id, name=opt.name, price_cents=opt.price_cents)
            )

        # Enforce per-group min/max selection rules.
        for group in product.topping_groups:
            group_ids = {opt.id for opt in group.options}
            chosen = [t for t in selected if t.id in group_ids]
            if len(chosen) < group.min:
                raise ValidationError(f"Choose at least {group.min} from '{group.name}'.")
            if group.max and len(chosen) > group.max:
                raise ValidationError(f"Choose at most {group.max} from '{group.name}'.")

        unit = size.price_cents + sum(t.price_cents for t in selected)
        return PricedSelection(product, size, selected, unit)

    # ── Admin CRUD ────────────────────────────────────────────────
    def create_product(self, payload: ProductCreate) -> Product:
        self._ensure_sizes(payload.sizes)
        product_id = new_id("prod")
        now = self._products.now()
        data: dict[str, Any] = payload.model_dump()
        data.update(created_at=now, updated_at=now)
        return Product.model_validate(self._products.set(product_id, data))

    def update_product(self, product_id: str, payload: ProductUpdate) -> Product:
        self.get_product(product_id)
        changes = payload.model_dump(exclude_none=True)
        if "sizes" in changes:
            self._ensure_sizes(payload.sizes or [])
        return Product.model_validate(self._products.update(product_id, changes))

    def delete_product(self, product_id: str) -> None:
        """Soft delete — keep historical references intact."""
        self.get_product(product_id)
        self._products.update(product_id, {"is_active": False})

    def create_category(self, payload: CategoryCreate) -> Category:
        data = payload.model_dump()
        return Category.model_validate(self._categories.set(payload.id, data))

    def update_category(self, category_id: str, payload: CategoryUpdate) -> Category:
        if not self._categories.get(category_id):
            raise NotFoundError("Category not found.")
        changes = payload.model_dump(exclude_none=True)
        return Category.model_validate(self._categories.update(category_id, changes))

    @staticmethod
    def _ensure_sizes(sizes: list[ProductSize]) -> None:
        if not sizes:
            raise ValidationError("A product must have at least one size.")

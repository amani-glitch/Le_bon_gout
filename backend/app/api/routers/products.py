"""Public menu routes — products and categories."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_product_service
from app.schemas.product import Category, Product
from app.services.product_service import ProductService

router = APIRouter(tags=["menu"])


@router.get("/products", response_model=list[Product])
def list_products(
    products: Annotated[ProductService, Depends(get_product_service)],
    category: str | None = None,
    active: bool = True,
) -> list[Product]:
    return products.list_products(category=category, active_only=active)


@router.get("/products/{product_id}", response_model=Product)
def get_product(
    product_id: str,
    products: Annotated[ProductService, Depends(get_product_service)],
) -> Product:
    return products.get_product(product_id)


@router.get("/categories", response_model=list[Category])
def list_categories(
    products: Annotated[ProductService, Depends(get_product_service)],
) -> list[Category]:
    return products.list_categories(active_only=True)

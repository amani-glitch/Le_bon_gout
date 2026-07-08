"""Admin product and category management."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import AdminDep, get_product_service
from app.schemas.product import (
    Category,
    CategoryCreate,
    CategoryUpdate,
    Product,
    ProductCreate,
    ProductUpdate,
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/admin", tags=["admin:products"])


@router.get("/products", response_model=list[Product])
def list_all_products(
    admin: AdminDep,
    products: Annotated[ProductService, Depends(get_product_service)],
) -> list[Product]:
    return products.list_products(active_only=False)


@router.post("/products", response_model=Product, status_code=201)
def create_product(
    payload: ProductCreate,
    admin: AdminDep,
    products: Annotated[ProductService, Depends(get_product_service)],
) -> Product:
    return products.create_product(payload)


@router.patch("/products/{product_id}", response_model=Product)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    admin: AdminDep,
    products: Annotated[ProductService, Depends(get_product_service)],
) -> Product:
    return products.update_product(product_id, payload)


@router.delete("/products/{product_id}")
def delete_product(
    product_id: str,
    admin: AdminDep,
    products: Annotated[ProductService, Depends(get_product_service)],
) -> dict:
    products.delete_product(product_id)
    return {"ok": True}


@router.get("/categories", response_model=list[Category])
def list_all_categories(
    admin: AdminDep,
    products: Annotated[ProductService, Depends(get_product_service)],
) -> list[Category]:
    return products.list_categories(active_only=False)


@router.post("/categories", response_model=Category, status_code=201)
def create_category(
    payload: CategoryCreate,
    admin: AdminDep,
    products: Annotated[ProductService, Depends(get_product_service)],
) -> Category:
    return products.create_category(payload)


@router.patch("/categories/{category_id}", response_model=Category)
def update_category(
    category_id: str,
    payload: CategoryUpdate,
    admin: AdminDep,
    products: Annotated[ProductService, Depends(get_product_service)],
) -> Category:
    return products.update_category(category_id, payload)

"""FastAPI application factory for Botler Pizza."""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

import stripe
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routers import (
    auth,
    bot,
    cart,
    favorites,
    leads,
    orders,
    products,
    profile,
    webhooks,
)
from app.api.routers.admin import conversations as admin_conversations
from app.api.routers.admin import customers as admin_customers
from app.api.routers.admin import leads as admin_leads
from app.api.routers.admin import metrics as admin_metrics
from app.api.routers.admin import orders as admin_orders
from app.api.routers.admin import products as admin_products
from app.core.config import get_settings
from app.core.error_handlers import register_error_handlers
from app.core.firestore import get_db

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key
    get_db()  # warm the Firestore client at startup
    logging.getLogger("botler").info("Botler Pizza API ready.")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Botler Pizza API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_error_handlers(app)

    api_routers = [
        auth.router,
        products.router,
        cart.router,
        orders.router,
        favorites.router,
        profile.router,
        webhooks.router,
        bot.router,
        leads.router,
        admin_orders.router,
        admin_products.router,
        admin_customers.router,
        admin_metrics.router,
        admin_conversations.router,
        admin_leads.router,
    ]
    for router in api_routers:
        app.include_router(router, prefix="/api")

    @app.get("/health", tags=["system"])
    def health() -> dict:
        return {"status": "ok"}

    _mount_frontend(app)
    return app


def _mount_frontend(app: FastAPI) -> None:
    """Serve the built React SPA when STATIC_DIR points at a dist folder.

    Used in the single-container Cloud Run deploy. Unset locally (Vite runs
    the frontend separately), so this is a no-op in development.
    """
    static_dir = os.environ.get("STATIC_DIR")
    if not static_dir or not Path(static_dir).is_dir():
        return

    root = Path(static_dir)
    index_file = root / "index.html"
    assets_dir = root / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str) -> FileResponse:
        # Serve real files (favicon, logo, etc.); otherwise fall back to
        # index.html so client-side routes (deep links / refresh) work.
        candidate = root / full_path
        if full_path and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(index_file))


app = create_app()

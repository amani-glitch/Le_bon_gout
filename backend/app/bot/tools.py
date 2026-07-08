"""Bot tool definitions + executor.

``BOT_TOOL_DECLARATIONS`` is the single source of truth for the function schema
exposed to Gemini (shared by chat and voice). ``BotToolExecutor`` runs a single
tool call against the existing services as the (optionally authenticated) user.

Tools accept human-friendly names ("large pepperoni", "extra cheese"); the
executor resolves them to the real product/size/topping ids via
``ProductService`` so pricing and customization rules stay server-authoritative.
"""
from __future__ import annotations

from typing import Any

from google.genai import types

from app.core.exceptions import AppError
from app.enums import FulfillmentType, PaymentMethod
from app.schemas.auth import CurrentUser
from app.schemas.cart import AddItemRequest, UpdateItemRequest
from app.schemas.order import CheckoutRequest
from app.schemas.product import Product
from app.schemas.user import User
from app.services.cart_service import CartService
from app.services.order_service import OrderService
from app.services.product_service import ProductService
from app.services.user_service import UserService
from app.utils.money import format_cents

# Tools that change server-side state — the client refreshes its cached
# ``cart``/``orders`` queries after any of these run.
MUTATING_TOOLS = {
    "add_to_cart",
    "update_cart_item",
    "remove_cart_item",
    "clear_cart",
    "place_order",
}


def _money(cents: int) -> str:
    return format_cents(cents)


# ── Gemini function declarations ──────────────────────────────────────
def _schema(**kwargs: Any) -> types.Schema:
    return types.Schema(**kwargs)


BOT_TOOL_DECLARATIONS: list[types.FunctionDeclaration] = [
    types.FunctionDeclaration(
        name="list_menu",
        description=(
            "List the menu. Optionally filter by a category name (e.g. 'pizza', "
            "'sides', 'drinks'). Returns products with their starting price and sizes."
        ),
        parameters=_schema(
            type=types.Type.OBJECT,
            properties={
                "category": _schema(
                    type=types.Type.STRING,
                    description="Optional category name to filter by.",
                ),
            },
        ),
    ),
    types.FunctionDeclaration(
        name="get_product",
        description=(
            "Get full details for one menu item by name or id: description, all "
            "sizes with prices, and available topping groups/options with prices."
        ),
        parameters=_schema(
            type=types.Type.OBJECT,
            properties={
                "query": _schema(
                    type=types.Type.STRING,
                    description="Product name (or id), e.g. 'Pepperoni'.",
                ),
            },
            required=["query"],
        ),
    ),
    types.FunctionDeclaration(
        name="add_to_cart",
        description=(
            "Add an item to the signed-in user's cart. Resolve the product, size "
            "and toppings by name. If the product has multiple sizes you MUST pass "
            "a size; if unsure, call get_product first and ask the user."
        ),
        parameters=_schema(
            type=types.Type.OBJECT,
            properties={
                "product": _schema(type=types.Type.STRING, description="Product name."),
                "size": _schema(
                    type=types.Type.STRING,
                    description="Size name, e.g. 'Large'. Optional if the product has one size.",
                ),
                "toppings": _schema(
                    type=types.Type.ARRAY,
                    items=_schema(type=types.Type.STRING),
                    description="Topping names to add, e.g. ['Extra cheese','Mushrooms'].",
                ),
                "quantity": _schema(type=types.Type.INTEGER, description="Quantity (default 1)."),
                "notes": _schema(
                    type=types.Type.STRING, description="Optional notes for the kitchen."
                ),
            },
            required=["product"],
        ),
    ),
    types.FunctionDeclaration(
        name="view_cart",
        description="Show the signed-in user's current cart with line items and subtotal.",
        parameters=_schema(type=types.Type.OBJECT, properties={}),
    ),
    types.FunctionDeclaration(
        name="update_cart_item",
        description=(
            "Change a line already in the cart, identified by its product name. "
            "Can change quantity, size or toppings."
        ),
        parameters=_schema(
            type=types.Type.OBJECT,
            properties={
                "item": _schema(
                    type=types.Type.STRING,
                    description="Product name of the line to change.",
                ),
                "quantity": _schema(type=types.Type.INTEGER),
                "size": _schema(type=types.Type.STRING),
                "toppings": _schema(type=types.Type.ARRAY, items=_schema(type=types.Type.STRING)),
                "notes": _schema(type=types.Type.STRING),
            },
            required=["item"],
        ),
    ),
    types.FunctionDeclaration(
        name="remove_cart_item",
        description="Remove a line from the cart, identified by its product name.",
        parameters=_schema(
            type=types.Type.OBJECT,
            properties={
                "item": _schema(type=types.Type.STRING, description="Product name to remove.")
            },
            required=["item"],
        ),
    ),
    types.FunctionDeclaration(
        name="clear_cart",
        description="Empty the signed-in user's cart entirely.",
        parameters=_schema(type=types.Type.OBJECT, properties={}),
    ),
    types.FunctionDeclaration(
        name="place_order",
        description=(
            "Place the order from the current cart. payment_method 'cash' means pay "
            "on delivery / on collection and is placed immediately once confirmed. "
            "payment_method 'card' cannot be charged here — it returns a handoff so "
            "the user finishes payment on the checkout page. Always summarise the "
            "order and total and get an explicit yes before calling with confirm=true."
        ),
        parameters=_schema(
            type=types.Type.OBJECT,
            properties={
                "fulfillment_type": _schema(
                    type=types.Type.STRING,
                    description="'delivery' or 'pickup' (collection).",
                ),
                "payment_method": _schema(
                    type=types.Type.STRING,
                    description="'cash' (pay on delivery/collection) or 'card' (online).",
                ),
                "notes": _schema(type=types.Type.STRING, description="Optional order notes."),
                "confirm": _schema(
                    type=types.Type.BOOLEAN,
                    description="Set true only after the user has explicitly confirmed.",
                ),
            },
            required=["fulfillment_type", "payment_method"],
        ),
    ),
    types.FunctionDeclaration(
        name="get_order_status",
        description=(
            "Get the status of the user's order. Pass order_id for a specific order, "
            "or omit it for their most recent order."
        ),
        parameters=_schema(
            type=types.Type.OBJECT,
            properties={"order_id": _schema(type=types.Type.STRING)},
        ),
    ),
]


class BotToolExecutor:
    """Executes one tool call against the services as the current user.

    Menu tools are public; cart/order tools require ``current_user`` and return a
    friendly ``{"error": ...}`` (rather than raising) when the user isn't signed
    in, so the model can ask them to log in and carry on.
    """

    def __init__(
        self,
        *,
        products: ProductService,
        carts: CartService,
        orders: OrderService,
        users: UserService,
        current_user: CurrentUser | None,
    ) -> None:
        self._products = products
        self._carts = carts
        self._orders = orders
        self._users = users
        self._user = current_user

    # ── dispatch ──────────────────────────────────────────────────────
    def dispatch(self, name: str, args: dict[str, Any]) -> dict[str, Any]:
        """Run a tool by name. Never raises for expected failures — returns
        ``{"error": message}`` so the model can recover conversationally."""
        handler = getattr(self, f"_tool_{name}", None)
        if handler is None:
            return {"error": f"Unknown tool '{name}'."}
        try:
            return handler(args or {})
        except _NeedsAuth:
            return {"error": "Please sign in to do that — menu questions don't need an account."}
        except AppError as exc:
            return {"error": exc.message}
        except Exception as exc:  # pragma: no cover - defensive
            return {"error": f"Sorry, that didn't work: {exc}"}

    # ── menu (public) ──────────────────────────────────────────────────
    def _tool_list_menu(self, args: dict[str, Any]) -> dict[str, Any]:
        category = args.get("category")
        cat_id = None
        if category:
            cat = self._match_category(category)
            cat_id = cat.id if cat else category.strip().lower()
        products = self._products.list_products(category=cat_id, active_only=True)
        return {
            "items": [self._product_brief(p) for p in products],
            "count": len(products),
        }

    def _tool_get_product(self, args: dict[str, Any]) -> dict[str, Any]:
        product = self._resolve_product(args["query"])
        return self._product_detail(product)

    # ── cart (auth) ─────────────────────────────────────────────────────
    def _tool_add_to_cart(self, args: dict[str, Any]) -> dict[str, Any]:
        self._require_user()
        product = self._resolve_product(args["product"])
        size_id = self._resolve_size(product, args.get("size"))
        topping_ids = self._resolve_toppings(product, args.get("toppings") or [])
        payload = AddItemRequest(
            product_id=product.id,
            size_id=size_id,
            topping_ids=topping_ids,
            quantity=int(args.get("quantity") or 1),
            notes=args.get("notes"),
        )
        cart = self._carts.add_item(self._user.id, payload)  # type: ignore[union-attr]
        return {"ok": True, "added": product.name, "cart": self._cart_view(cart)}

    def _tool_view_cart(self, args: dict[str, Any]) -> dict[str, Any]:
        self._require_user()
        cart = self._carts.get_cart(self._user.id)  # type: ignore[union-attr]
        return {"cart": self._cart_view(cart)}

    def _tool_update_cart_item(self, args: dict[str, Any]) -> dict[str, Any]:
        self._require_user()
        cart = self._carts.get_cart(self._user.id)  # type: ignore[union-attr]
        line = self._find_line(cart, args["item"])
        size_id = None
        topping_ids = None
        if args.get("size") or args.get("toppings") is not None:
            product = self._resolve_product(line.product_id)
            if args.get("size"):
                size_id = self._resolve_size(product, args["size"])
            if args.get("toppings") is not None:
                topping_ids = self._resolve_toppings(product, args.get("toppings") or [])
        payload = UpdateItemRequest(
            quantity=int(args["quantity"]) if args.get("quantity") is not None else None,
            size_id=size_id,
            topping_ids=topping_ids,
            notes=args.get("notes"),
        )
        updated = self._carts.update_item(self._user.id, line.line_id, payload)  # type: ignore[union-attr]
        return {"ok": True, "cart": self._cart_view(updated)}

    def _tool_remove_cart_item(self, args: dict[str, Any]) -> dict[str, Any]:
        self._require_user()
        cart = self._carts.get_cart(self._user.id)  # type: ignore[union-attr]
        line = self._find_line(cart, args["item"])
        updated = self._carts.remove_item(self._user.id, line.line_id)  # type: ignore[union-attr]
        return {"ok": True, "removed": line.name, "cart": self._cart_view(updated)}

    def _tool_clear_cart(self, args: dict[str, Any]) -> dict[str, Any]:
        self._require_user()
        cart = self._carts.clear(self._user.id)  # type: ignore[union-attr]
        return {"ok": True, "cart": self._cart_view(cart)}

    # ── orders (auth) ───────────────────────────────────────────────────
    def _tool_place_order(self, args: dict[str, Any]) -> dict[str, Any]:
        self._require_user()
        fulfillment = self._parse_fulfillment(args.get("fulfillment_type"))
        method_raw = (args.get("payment_method") or "").strip().lower()

        if method_raw in {"card", "online", "credit", "stripe"}:
            return {
                "action": "handoff_checkout",
                "message": (
                    "Card payment is completed securely on the checkout page. "
                    "Your cart is ready — I'll take you there."
                ),
            }
        if method_raw not in {"cash", "cash_on_delivery", "cod", "pay on delivery", ""}:
            return {"error": f"Unknown payment method '{method_raw}'. Use 'cash' or 'card'."}

        cart = self._carts.get_cart(self._user.id)  # type: ignore[union-attr]
        if not cart.items:
            return {"error": "The cart is empty — add something before ordering."}

        user = self._load_user()
        address = None
        if fulfillment == FulfillmentType.delivery:
            address = self._default_address(user)
            if address is None:
                return {
                    "error": (
                        "I need a delivery address. Please add one in your profile, "
                        "or choose collection (pickup) instead."
                    )
                }

        summary = self._cart_view(cart)
        delivery_fee = 0 if fulfillment == FulfillmentType.pickup else None
        if not args.get("confirm"):
            return {
                "needs_confirmation": True,
                "summary": summary,
                "fulfillment": fulfillment.value,
                "payment": "cash (pay on delivery / collection)",
                "deliver_to": address.model_dump() if address else None,
                "message": "Confirm and I'll place this order.",
            }

        payload = CheckoutRequest(
            payment_method=PaymentMethod.cash_on_delivery,
            fulfillment_type=fulfillment,
            address=address,
            notes=args.get("notes"),
        )
        result = self._orders.checkout(user, payload)
        order = result.order
        _ = delivery_fee
        return {
            "ok": True,
            "order_id": order.id,
            "status": order.status.value,
            "total": _money(order.total_cents),
            "fulfillment": order.fulfillment.type.value,
            "message": f"Order {order.id} placed — pay on {order.fulfillment.type.value}.",
        }

    def _tool_get_order_status(self, args: dict[str, Any]) -> dict[str, Any]:
        self._require_user()
        order_id = args.get("order_id")
        if order_id:
            order = self._orders.get_for_user(self._user, order_id)  # type: ignore[arg-type]
        else:
            orders, _ = self._orders.list_for_user(self._user.id, limit=1, cursor=None)  # type: ignore[union-attr]
            if not orders:
                return {"message": "You don't have any orders yet."}
            order = orders[0]
        return {
            "order_id": order.id,
            "status": order.status.value,
            "total": _money(order.total_cents),
            "items": [f"{i.quantity}× {i.name} ({i.size_name})" for i in order.items],
            "placed_at": order.created_at.isoformat() if order.created_at else None,
        }

    # ── resolution helpers ──────────────────────────────────────────────
    def _resolve_product(self, query: str) -> Product:
        query = (query or "").strip()
        if not query:
            raise _ToolError("Which item did you mean?")
        products = self._products.list_products(active_only=True)
        # Exact id or exact (case-insensitive) name first.
        for p in products:
            if p.id == query or p.name.lower() == query.lower():
                return p
        matches = [p for p in products if query.lower() in p.name.lower()]
        if len(matches) == 1:
            return matches[0]
        if not matches:
            raise _ToolError(f"I couldn't find '{query}' on the menu.")
        names = ", ".join(p.name for p in matches[:6])
        raise _ToolError(f"Did you mean one of: {names}?")

    def _resolve_size(self, product: Product, size: str | None) -> str:
        if not product.sizes:
            raise _ToolError(f"'{product.name}' has no sizes configured.")
        if size:
            for s in product.sizes:
                if s.id == size or s.name.lower() == size.strip().lower():
                    return s.id
            options = ", ".join(s.name for s in product.sizes)
            raise _ToolError(f"'{size}' isn't a size for {product.name}. Options: {options}.")
        if len(product.sizes) == 1:
            return product.sizes[0].id
        options = ", ".join(f"{s.name} ({_money(s.price_cents)})" for s in product.sizes)
        raise _ToolError(f"Which size for {product.name}? {options}.")

    def _resolve_toppings(self, product: Product, toppings: list[str]) -> list[str]:
        by_name = {
            opt.name.lower(): opt.id
            for group in product.topping_groups
            for opt in group.options
        }
        by_id = {
            opt.id: opt.id for group in product.topping_groups for opt in group.options
        }
        resolved: list[str] = []
        for t in toppings:
            key = (t or "").strip().lower()
            if key in by_name:
                resolved.append(by_name[key])
            elif t in by_id:
                resolved.append(by_id[t])
            else:
                raise _ToolError(f"'{t}' isn't available on {product.name}.")
        return resolved

    def _match_category(self, name: str):
        target = name.strip().lower()
        for c in self._products.list_categories(active_only=True):
            if c.id == target or c.name.lower() == target:
                return c
        return None

    def _find_line(self, cart, item: str):
        target = (item or "").strip().lower()
        matches = [
            i for i in cart.items
            if i.name.lower() == target or target in i.name.lower() or i.line_id == item
        ]
        if not matches:
            raise _ToolError(f"'{item}' isn't in your cart.")
        if len(matches) > 1:
            raise _ToolError(
                f"You have a few '{item}' lines — please be more specific."
            )
        return matches[0]

    def _default_address(self, user: User):
        if not user.addresses:
            return None
        return next((a for a in user.addresses if a.is_default), user.addresses[0])

    def _load_user(self) -> User:
        assert self._user is not None
        try:
            return self._users.get(self._user.id)
        except AppError:
            # Fall back to a minimal identity if no profile doc exists.
            return User(
                id=self._user.id,
                email=self._user.email,
                display_name=self._user.email.split("@")[0],
            )

    @staticmethod
    def _parse_fulfillment(value: str | None) -> FulfillmentType:
        v = (value or "delivery").strip().lower()
        if v in {"pickup", "collection", "collect", "takeaway"}:
            return FulfillmentType.pickup
        return FulfillmentType.delivery

    # ── view formatting ─────────────────────────────────────────────────
    def _product_brief(self, p: Product) -> dict[str, Any]:
        from_price = min((s.price_cents for s in p.sizes), default=p.base_price_cents)
        return {
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "description": p.description,
            "from_price": _money(from_price),
            "sizes": [s.name for s in p.sizes],
        }

    def _product_detail(self, p: Product) -> dict[str, Any]:
        return {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "sizes": [{"name": s.name, "price": _money(s.price_cents)} for s in p.sizes],
            "topping_groups": [
                {
                    "name": g.name,
                    "min": g.min,
                    "max": g.max,
                    "options": [
                        {"name": o.name, "price": _money(o.price_cents)} for o in g.options
                    ],
                }
                for g in p.topping_groups
            ],
        }

    def _cart_view(self, cart) -> dict[str, Any]:
        return {
            "items": [
                {
                    "name": i.name,
                    "size": i.size_name,
                    "toppings": [t.name for t in i.toppings],
                    "quantity": i.quantity,
                    "line_total": _money(i.line_total_cents),
                }
                for i in cart.items
            ],
            "subtotal": _money(cart.subtotal_cents),
            "item_count": sum(i.quantity for i in cart.items),
        }

    # ── auth guard ──────────────────────────────────────────────────────
    def _require_user(self) -> None:
        if self._user is None:
            raise _NeedsAuth()


class _NeedsAuth(Exception):
    """Raised when a cart/order tool is used without a signed-in user."""


class _ToolError(AppError):
    """A recoverable, user-facing tool error (resolved by ``dispatch``)."""

    status_code = 400
    code = "bot_tool_error"

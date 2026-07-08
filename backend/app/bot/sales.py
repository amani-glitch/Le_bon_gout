"""Website host assistant — system prompt, tools and executor.

A second "assistant profile" alongside the ordering concierge. It answers
visitors' questions about Route 66 (menu, prices, hours, delivery, branches) and
captures contact requests (callbacks, reservations, catering/large orders) into
Firestore via ``capture_lead``. It shares the chat/voice infra: ``SalesToolExecutor``
exposes the same ``dispatch(name, args) -> dict`` interface as ``BotToolExecutor``.
"""
from __future__ import annotations

from typing import Any

from google.genai import types

from app.core.exceptions import AppError
from app.schemas.auth import CurrentUser
from app.schemas.lead import LeadCreate
from app.services.lead_service import LeadService

CONTACT_PHONE = "20 435 635"

SALES_SYSTEM_INSTRUCTION = f"""\
You are the friendly host of **Le Bon Goût** — a restaurant & pizzeria in Le \
Bardo, Tunis, on the website's home page. You chat with visitors: answer their \
questions and help them order or get in touch.

About Le Bon Goût:
- A neighbourhood restaurant open for 20 years: continental dishes, Tunisian \
specialties and wood-fired pizzas ("quick lunch").
- Address: Rue de Marrakech, Le Bardo, Tunis 2000.
- Phone: {CONTACT_PHONE}. Email: bongout.bardo@gmail.com.
- Open every day, 10:00–23:55. Dine-in, takeaway and delivery. Bank card accepted.
- Menu: wood-fired pizzas, pasta & risotto, grills & mains (escalope, grilled \
chicken, grilled fish, seafood paella, mixed grill), starters & salads, desserts \
and drinks. Affordable — around 10–20 DT per person.

How to behave:
- Be concise, warm and genuinely helpful; this is chat and sometimes a phone call.
- Answer using only the facts above and encourage guests to browse the menu and \
order online. Never invent prices or dishes; for exact prices point them to the menu.
- If a visitor wants a callback, a table reservation, catering or a large/group \
order, capture their details with the capture_lead tool. Gather at least a name and \
an email (and a phone number if they'd prefer a call); ask what they need when it \
feels natural. Confirm before saving and let them know the team will follow up. \
Don't ask for everything at once.
- If asked something you don't know, offer to have the team call them back, or give \
the phone number {CONTACT_PHONE}.
- Always reply in the same language as the visitor's latest message.
"""

SALES_TOOL_DECLARATIONS: list[types.FunctionDeclaration] = [
    types.FunctionDeclaration(
        name="capture_lead",
        description=(
            "Save a visitor's contact details so the Le Bon Goût team can follow up "
            "about a callback, a table reservation, catering or a large/group order. "
            "Call this once the visitor has shared at least a name and email and wants "
            "to be contacted."
        ),
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "name": types.Schema(type=types.Type.STRING, description="Contact's full name."),
                "email": types.Schema(type=types.Type.STRING, description="Contact email address."),
                "phone": types.Schema(
                    type=types.Type.STRING, description="Phone number (optional)."
                ),
                "company": types.Schema(
                    type=types.Type.STRING,
                    description="Company/event name, if relevant (optional).",
                ),
                "business_type": types.Schema(
                    type=types.Type.STRING,
                    description="Context, e.g. 'reservation', 'catering', 'group order' (optional).",
                ),
                "interest": types.Schema(
                    type=types.Type.STRING,
                    description=(
                        "One of 'basic' (order/delivery question), 'custom' "
                        "(event/catering/large order) or 'unsure' (other)."
                    ),
                ),
                "message": types.Schema(
                    type=types.Type.STRING,
                    description="What the prospect is looking for, in their words (optional).",
                ),
            },
            required=["name", "email"],
        ),
    ),
]

_INTEREST_VALUES = {"basic", "custom", "unsure"}


class SalesToolExecutor:
    """Executes the sales assistant's tools. Mirrors ``BotToolExecutor.dispatch``."""

    def __init__(
        self,
        *,
        leads: LeadService,
        current_user: CurrentUser | None = None,
        channel: str = "bot_chat",
        conversation_id: str | None = None,
    ) -> None:
        self._leads = leads
        self._user = current_user
        self._channel = channel
        self._conversation_id = conversation_id

    def dispatch(self, name: str, args: dict[str, Any]) -> dict[str, Any]:
        handler = getattr(self, f"_tool_{name}", None)
        if handler is None:
            return {"error": f"Unknown tool '{name}'."}
        try:
            return handler(args or {})
        except AppError as exc:
            return {"error": exc.message}
        except Exception as exc:  # pragma: no cover - defensive
            return {"error": f"Sorry, that didn't work: {exc}"}

    def _tool_capture_lead(self, args: dict[str, Any]) -> dict[str, Any]:
        name = (args.get("name") or "").strip()
        email = (args.get("email") or "").strip()
        if not name or not email:
            return {"error": "I need at least a name and an email to pass to the team."}
        interest = (args.get("interest") or "unsure").strip().lower()
        if interest not in _INTEREST_VALUES:
            interest = "unsure"
        try:
            payload = LeadCreate(
                name=name,
                email=email,
                phone=(args.get("phone") or None),
                company=(args.get("company") or None),
                business_type=(args.get("business_type") or None),
                interest=interest,  # type: ignore[arg-type]
                message=(args.get("message") or None),
            )
        except Exception:
            return {"error": "That email doesn't look valid — could you double-check it?"}
        source = "bot_voice" if self._channel == "voice" else "bot_chat"
        lead = self._leads.create_lead(
            payload,
            source=source,  # type: ignore[arg-type]
            channel=self._channel,
            conversation_id=self._conversation_id,
        )
        return {
            "ok": True,
            "lead_id": lead.id,
            "message": (
                f"Thank you, {lead.name.split()[0]}. I've passed your details to the Le Bon Goût "
                f"team — they'll be in touch shortly. You can also call us at {CONTACT_PHONE}."
            ),
        }


__all__ = [
    "CONTACT_PHONE",
    "SALES_SYSTEM_INSTRUCTION",
    "SALES_TOOL_DECLARATIONS",
    "SalesToolExecutor",
]

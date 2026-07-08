"""Request/response contracts for the bot chat endpoint + admin history."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import ApiModel


class ChatMessage(ApiModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(ApiModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)
    # Reused across turns so the whole conversation lands in one stored record.
    conversation_id: str | None = None
    # Which assistant profile answers: the B2C ordering concierge (default) or the
    # B2B sales assistant on the marketing landing page.
    assistant: Literal["concierge", "sales"] = "concierge"


class ChatResponse(ApiModel):
    reply: str
    # Identifier the client echoes back on the next turn (see ChatRequest).
    conversation_id: str | None = None
    # Names of tools executed this turn (the client refreshes cart/orders if any
    # of them mutate state).
    tool_calls: list[str] = Field(default_factory=list)
    # Set when the bot wants the SPA to route to the checkout page (card pay).
    handoff: str | None = None
    # Set when an order was placed, so the client can link to it.
    order_id: str | None = None


# ── Admin history + stats ─────────────────────────────────────────
class BotMessage(ApiModel):
    role: str
    content: str
    at: datetime | None = None


class BotConversationSummary(ApiModel):
    """Lightweight row for the admin history list (no transcript)."""

    id: str
    channel: Literal["chat", "voice"]
    # Which assistant produced this conversation: B2C "concierge" or B2B "sales".
    bot_type: Literal["concierge", "sales"] = "concierge"
    user_id: str | None = None
    customer_email: str | None = None
    anonymous: bool = True
    message_count: int = 0
    tool_calls: list[str] = Field(default_factory=list)
    order_ids: list[str] = Field(default_factory=list)
    duration_seconds: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    ended_at: datetime | None = None


class BotConversation(BotConversationSummary):
    """Full record including the transcript."""

    messages: list[BotMessage] = Field(default_factory=list)


class BotToolCount(ApiModel):
    tool: str
    count: int


class BotStats(ApiModel):
    total_conversations: int
    total_chats: int
    total_calls: int
    conversations_today: int
    calls_today: int
    total_messages: int
    orders_via_bot: int
    top_tools: list[BotToolCount] = Field(default_factory=list)

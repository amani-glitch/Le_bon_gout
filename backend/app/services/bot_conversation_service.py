"""Bot conversation service — persists chat/voice sessions and computes stats.

Stats are computed in memory over the collection (like ``MetricsService``);
fine at this scale, revisit with rollups if conversation volume grows.
"""
from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime
from typing import Any

from app.bot.schemas import (
    BotConversation,
    BotConversationSummary,
    BotStats,
    BotToolCount,
)
from app.repositories.bot_conversation_repo import BotConversationRepository
from app.schemas.auth import CurrentUser
from app.utils.ids import new_id


def _dedup(values: list[str]) -> list[str]:
    return list(dict.fromkeys(v for v in values if v))


class BotConversationService:
    def __init__(self, repo: BotConversationRepository) -> None:
        self._repo = repo

    # ── Chat ──────────────────────────────────────────────────────
    @staticmethod
    def new_conversation_id() -> str:
        """Mint a conversation id without touching the store, so the chat
        endpoint can return it immediately and persist the turn in the
        background."""
        return new_id("conv")

    def record_chat_turn(
        self,
        *,
        conversation_id: str | None,
        user: CurrentUser | None,
        messages: list[dict[str, Any]],
        tool_calls: list[str],
        order_id: str | None,
        bot_type: str = "concierge",
    ) -> str:
        """Upsert the full transcript so far. Returns the conversation id."""
        now = self._repo.now()
        existing = self._repo.get(conversation_id) if conversation_id else None
        if existing:
            tools = _dedup(existing.get("tool_calls", []) + tool_calls)
            orders = _dedup(existing.get("order_ids", []) + ([order_id] if order_id else []))
            self._repo.update(
                existing["id"],
                {
                    "messages": messages,
                    "message_count": len(messages),
                    "tool_calls": tools,
                    "order_ids": orders,
                },
            )
            return existing["id"]

        cid = conversation_id or new_id("conv")
        self._repo.create(
            cid,
            {
                "channel": "chat",
                "bot_type": bot_type,
                "user_id": user.id if user else None,
                "customer_email": user.email if user else None,
                "anonymous": user is None,
                "messages": messages,
                "message_count": len(messages),
                "tool_calls": _dedup(tool_calls),
                "order_ids": [order_id] if order_id else [],
                "created_at": now,
                "updated_at": now,
            },
        )
        return cid

    # ── Voice ─────────────────────────────────────────────────────
    def start_call(self, user: CurrentUser | None, *, bot_type: str = "concierge") -> str:
        cid = new_id("conv")
        now = self._repo.now()
        self._repo.create(
            cid,
            {
                "channel": "voice",
                "bot_type": bot_type,
                "user_id": user.id if user else None,
                "customer_email": user.email if user else None,
                "anonymous": user is None,
                "messages": [],
                "message_count": 0,
                "tool_calls": [],
                "order_ids": [],
                "created_at": now,
                "updated_at": now,
            },
        )
        return cid

    def finalize_call(
        self,
        conversation_id: str,
        *,
        messages: list[dict[str, Any]],
        tool_calls: list[str],
        order_ids: list[str],
        started_at: datetime,
        ended_at: datetime,
    ) -> None:
        duration = max(0, int((ended_at - started_at).total_seconds()))
        self._repo.update(
            conversation_id,
            {
                "messages": messages,
                "message_count": len(messages),
                "tool_calls": _dedup(tool_calls),
                "order_ids": _dedup(order_ids),
                "ended_at": ended_at,
                "duration_seconds": duration,
            },
        )

    # ── Admin reads ───────────────────────────────────────────────
    def list_admin(
        self, *, channel: str | None, limit: int, cursor: str | None
    ) -> tuple[list[BotConversationSummary], str | None]:
        items, next_cursor = self._repo.list_admin(channel=channel, limit=limit, cursor=cursor)
        return [BotConversationSummary.model_validate(i) for i in items], next_cursor

    def get_admin(self, conversation_id: str) -> BotConversation | None:
        data = self._repo.get(conversation_id)
        return BotConversation.model_validate(data) if data else None

    def stats(self) -> BotStats:
        convos = self._repo.all()
        today = datetime.now(UTC).date()
        chats = calls = convos_today = calls_today = 0
        total_messages = orders_via_bot = 0
        tool_counter: Counter[str] = Counter()

        for c in convos:
            channel = c.get("channel", "chat")
            if channel == "voice":
                calls += 1
            else:
                chats += 1

            created = c.get("created_at")
            if isinstance(created, datetime) and created.date() == today:
                convos_today += 1
                if channel == "voice":
                    calls_today += 1

            total_messages += c.get("message_count", 0)
            if c.get("order_ids"):
                orders_via_bot += 1
            for tool in c.get("tool_calls", []):
                tool_counter[tool] += 1

        return BotStats(
            total_conversations=len(convos),
            total_chats=chats,
            total_calls=calls,
            conversations_today=convos_today,
            calls_today=calls_today,
            total_messages=total_messages,
            orders_via_bot=orders_via_bot,
            top_tools=[BotToolCount(tool=t, count=n) for t, n in tool_counter.most_common(6)],
        )

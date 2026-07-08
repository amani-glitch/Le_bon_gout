"""Unit tests for BotConversationService — persistence + stats aggregation."""
from __future__ import annotations

from datetime import UTC, datetime

from app.enums import UserRole
from app.schemas.auth import CurrentUser
from app.services.bot_conversation_service import BotConversationService


class FakeConvRepo:
    def __init__(self) -> None:
        self._data: dict[str, dict] = {}

    @staticmethod
    def now() -> datetime:
        return datetime.now(UTC)

    def get(self, cid: str) -> dict | None:
        return self._data.get(cid)

    def create(self, cid: str, data: dict) -> dict:
        self._data[cid] = {**data, "id": cid}
        return self._data[cid]

    def update(self, cid: str, data: dict) -> dict:
        self._data[cid].update(data)
        return self._data[cid]

    def all(self) -> list[dict]:
        return list(self._data.values())


def _user() -> CurrentUser:
    return CurrentUser(id="u1", email="u@e.com", role=UserRole.customer)


def test_record_chat_turn_creates_then_appends() -> None:
    svc = BotConversationService(FakeConvRepo())  # type: ignore[arg-type]
    cid = svc.record_chat_turn(
        conversation_id=None,
        user=_user(),
        messages=[{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}],
        tool_calls=["list_menu"],
        order_id=None,
    )
    assert cid

    # Second turn reuses the id and replaces with the fuller transcript.
    same = svc.record_chat_turn(
        conversation_id=cid,
        user=_user(),
        messages=[
            {"role": "user", "content": "hi"},
            {"role": "assistant", "content": "hello"},
            {"role": "user", "content": "order a margherita"},
            {"role": "assistant", "content": "done"},
        ],
        tool_calls=["add_to_cart", "place_order"],
        order_id="ord_123",
    )
    assert same == cid
    convo = svc.get_admin(cid)
    assert convo is not None
    assert convo.message_count == 4
    assert convo.channel == "chat"
    assert set(convo.tool_calls) == {"list_menu", "add_to_cart", "place_order"}
    assert convo.order_ids == ["ord_123"]


def test_anonymous_chat_is_flagged() -> None:
    svc = BotConversationService(FakeConvRepo())  # type: ignore[arg-type]
    cid = svc.record_chat_turn(
        conversation_id=None,
        user=None,
        messages=[{"role": "user", "content": "what pizzas?"}],
        tool_calls=["list_menu"],
        order_id=None,
    )
    convo = svc.get_admin(cid)
    assert convo is not None
    assert convo.anonymous is True
    assert convo.customer_email is None


def test_voice_call_lifecycle_and_stats() -> None:
    repo = FakeConvRepo()
    svc = BotConversationService(repo)  # type: ignore[arg-type]

    # A chat conversation that placed an order.
    svc.record_chat_turn(
        conversation_id=None,
        user=_user(),
        messages=[{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hey"}],
        tool_calls=["place_order"],
        order_id="ord_1",
    )

    # A voice call.
    started = datetime(2026, 6, 24, 12, 0, 0, tzinfo=UTC)
    ended = datetime(2026, 6, 24, 12, 2, 30, tzinfo=UTC)
    cid = svc.start_call(_user())
    svc.finalize_call(
        cid,
        messages=[{"role": "user", "content": "a large pepperoni"}],
        tool_calls=["add_to_cart"],
        order_ids=[],
        started_at=started,
        ended_at=ended,
    )

    stats = svc.stats()
    assert stats.total_conversations == 2
    assert stats.total_chats == 1
    assert stats.total_calls == 1
    assert stats.orders_via_bot == 1
    tool_names = {t.tool for t in stats.top_tools}
    assert {"place_order", "add_to_cart"} <= tool_names

    call = svc.get_admin(cid)
    assert call is not None
    assert call.channel == "voice"
    assert call.duration_seconds == 150

"""Admin bot conversation + call history and stats."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import AdminDep, get_bot_conversation_service
from app.bot.schemas import BotConversation, BotConversationSummary, BotStats
from app.core.exceptions import NotFoundError
from app.schemas.common import Page
from app.services.bot_conversation_service import BotConversationService

router = APIRouter(prefix="/admin/bot", tags=["admin:bot"])


@router.get("/stats", response_model=BotStats)
def stats(
    admin: AdminDep,
    conversations: Annotated[BotConversationService, Depends(get_bot_conversation_service)],
) -> BotStats:
    return conversations.stats()


@router.get("/conversations", response_model=Page[BotConversationSummary])
def list_conversations(
    admin: AdminDep,
    conversations: Annotated[BotConversationService, Depends(get_bot_conversation_service)],
    channel: str | None = None,
    limit: int = 25,
    cursor: str | None = None,
) -> Page[BotConversationSummary]:
    items, next_cursor = conversations.list_admin(channel=channel, limit=limit, cursor=cursor)
    return Page(items=items, next_cursor=next_cursor, has_more=next_cursor is not None)


@router.get("/conversations/{conversation_id}", response_model=BotConversation)
def get_conversation(
    conversation_id: str,
    admin: AdminDep,
    conversations: Annotated[BotConversationService, Depends(get_bot_conversation_service)],
) -> BotConversation:
    conversation = conversations.get_admin(conversation_id)
    if conversation is None:
        raise NotFoundError("Conversation not found.")
    return conversation

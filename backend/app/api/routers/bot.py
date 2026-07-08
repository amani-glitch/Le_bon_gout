"""Botler concierge routes — text chat (REST) and voice call (WebSocket)."""
from __future__ import annotations

import json
import logging
from collections.abc import Iterator
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, WebSocket
from fastapi.responses import StreamingResponse
from starlette.websockets import WebSocketState

from app.api.deps import (
    OptionalUserDep,
    SettingsDep,
    get_bot_agent,
    get_bot_conversation_service,
    get_cart_service,
    get_lead_service,
    get_order_service,
    get_product_service,
    get_sales_bot_agent,
    get_user_service,
    resolve_ws_user,
)
from app.bot.agent import SYSTEM_INSTRUCTION, BotAgent
from app.bot.live import run_live_session
from app.bot.sales import (
    SALES_SYSTEM_INSTRUCTION,
    SALES_TOOL_DECLARATIONS,
    SalesToolExecutor,
)
from app.bot.schemas import ChatRequest, ChatResponse
from app.bot.tools import BOT_TOOL_DECLARATIONS, BotToolExecutor
from app.services.bot_conversation_service import BotConversationService
from app.services.cart_service import CartService
from app.services.lead_service import LeadService
from app.services.order_service import OrderService
from app.services.product_service import ProductService
from app.services.user_service import UserService

router = APIRouter(prefix="/bot", tags=["bot"])
logger = logging.getLogger("botler.bot")


def _sse(payload: dict) -> str:
    """Serialize one Server-Sent Event ``data:`` frame."""
    return f"data: {json.dumps(payload)}\n\n"


def _select_chat_assistant(
    payload: ChatRequest,
    *,
    user,
    concierge_agent: BotAgent,
    sales_agent: BotAgent,
    products: ProductService,
    carts: CartService,
    orders: OrderService,
    users: UserService,
    leads: LeadService,
    conversation_id: str | None,
):
    """Return ``(agent, executor, bot_type)`` for the requested assistant profile."""
    if payload.assistant == "sales":
        executor = SalesToolExecutor(
            leads=leads,
            current_user=user,
            channel="bot_chat",
            conversation_id=conversation_id,
        )
        return sales_agent, executor, "sales"
    executor = BotToolExecutor(
        products=products, carts=carts, orders=orders, users=users, current_user=user
    )
    return concierge_agent, executor, "concierge"


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    user: OptionalUserDep,
    background: BackgroundTasks,
    agent: Annotated[BotAgent, Depends(get_bot_agent)],
    sales_agent: Annotated[BotAgent, Depends(get_sales_bot_agent)],
    products: Annotated[ProductService, Depends(get_product_service)],
    carts: Annotated[CartService, Depends(get_cart_service)],
    orders: Annotated[OrderService, Depends(get_order_service)],
    users: Annotated[UserService, Depends(get_user_service)],
    leads: Annotated[LeadService, Depends(get_lead_service)],
    conversations: Annotated[BotConversationService, Depends(get_bot_conversation_service)],
) -> ChatResponse:
    # The id is minted locally so we can return it now and write to Firestore
    # *after* the response is sent — keeping the store write off the reply path.
    conversation_id = payload.conversation_id or conversations.new_conversation_id()
    chat_agent, executor, bot_type = _select_chat_assistant(
        payload,
        user=user,
        concierge_agent=agent,
        sales_agent=sales_agent,
        products=products,
        carts=carts,
        orders=orders,
        users=users,
        leads=leads,
        conversation_id=conversation_id,
    )
    turn = chat_agent.run_chat(payload.messages, executor)

    # Persist the full transcript (incoming turns + this reply) for admin history.
    transcript = [{"role": m.role, "content": m.content} for m in payload.messages]
    transcript.append({"role": "assistant", "content": turn.reply})
    background.add_task(
        conversations.record_chat_turn,
        conversation_id=conversation_id,
        user=user,
        messages=transcript,
        tool_calls=turn.tool_calls,
        order_id=turn.order_id,
        bot_type=bot_type,
    )

    return ChatResponse(
        reply=turn.reply,
        conversation_id=conversation_id,
        tool_calls=turn.tool_calls,
        handoff=turn.handoff,
        order_id=turn.order_id,
    )


@router.post("/chat/stream")
def chat_stream(
    payload: ChatRequest,
    user: OptionalUserDep,
    agent: Annotated[BotAgent, Depends(get_bot_agent)],
    sales_agent: Annotated[BotAgent, Depends(get_sales_bot_agent)],
    products: Annotated[ProductService, Depends(get_product_service)],
    carts: Annotated[CartService, Depends(get_cart_service)],
    orders: Annotated[OrderService, Depends(get_order_service)],
    users: Annotated[UserService, Depends(get_user_service)],
    leads: Annotated[LeadService, Depends(get_lead_service)],
    conversations: Annotated[BotConversationService, Depends(get_bot_conversation_service)],
) -> StreamingResponse:
    """Same as ``/chat`` but streams the reply as Server-Sent Events:
    ``{"type":"delta","text":...}`` frames as tokens arrive, then a final
    ``{"type":"final", conversation_id, tool_calls, handoff, order_id}`` frame.
    """
    # Mint the id up front so the client gets it on the final frame; persistence
    # happens at the end of the stream (off the token path).
    conversation_id = payload.conversation_id or conversations.new_conversation_id()
    chat_agent, executor, bot_type = _select_chat_assistant(
        payload,
        user=user,
        concierge_agent=agent,
        sales_agent=sales_agent,
        products=products,
        carts=carts,
        orders=orders,
        users=users,
        leads=leads,
        conversation_id=conversation_id,
    )

    def event_stream() -> Iterator[str]:
        turn = None
        for kind, data in chat_agent.run_chat_stream(payload.messages, executor):
            if kind == "delta":
                yield _sse({"type": "delta", "text": data})
            elif kind == "final":
                turn = data
                yield _sse(
                    {
                        "type": "final",
                        "conversation_id": conversation_id,
                        "tool_calls": turn.tool_calls,
                        "handoff": turn.handoff,
                        "order_id": turn.order_id,
                    }
                )
        if turn is not None:
            transcript = [{"role": m.role, "content": m.content} for m in payload.messages]
            transcript.append({"role": "assistant", "content": turn.reply})
            try:
                conversations.record_chat_turn(
                    conversation_id=conversation_id,
                    user=user,
                    messages=transcript,
                    tool_calls=turn.tool_calls,
                    order_id=turn.order_id,
                    bot_type=bot_type,
                )
            except Exception:  # pragma: no cover - history logging must not break the reply
                logger.exception("Failed to persist streamed chat turn")

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.websocket("/voice")
async def voice(
    websocket: WebSocket,
    settings: SettingsDep,
    products: Annotated[ProductService, Depends(get_product_service)],
    carts: Annotated[CartService, Depends(get_cart_service)],
    orders: Annotated[OrderService, Depends(get_order_service)],
    users: Annotated[UserService, Depends(get_user_service)],
    leads: Annotated[LeadService, Depends(get_lead_service)],
    conversations: Annotated[BotConversationService, Depends(get_bot_conversation_service)],
) -> None:
    user = resolve_ws_user(websocket, settings)  # type: ignore[arg-type]
    is_sales = websocket.query_params.get("assistant") == "sales"
    await websocket.accept()
    if not settings.gemini_api_key:
        await websocket.send_json(
            {"type": "error", "message": "Voice is unavailable (GEMINI_API_KEY not set)."}
        )
        await websocket.close()
        return

    if is_sales:
        # ``run_live_session`` creates the conversation record (bot_type="sales");
        # the lead a capture_lead call produces carries channel="voice".
        executor: object = SalesToolExecutor(
            leads=leads, current_user=user, channel="voice"
        )
        system_instruction = SALES_SYSTEM_INSTRUCTION
        tools = SALES_TOOL_DECLARATIONS
        bot_type = "sales"
    else:
        executor = BotToolExecutor(
            products=products, carts=carts, orders=orders, users=users, current_user=user
        )
        system_instruction = SYSTEM_INSTRUCTION
        tools = BOT_TOOL_DECLARATIONS
        bot_type = "concierge"

    await run_live_session(
        websocket,
        executor,
        api_key=settings.gemini_api_key,
        model=settings.gemini_live_model,
        voice=settings.gemini_voice,
        system_instruction=system_instruction,
        tools=tools,
        conversations=conversations,
        user=user,
        bot_type=bot_type,
    )
    # ``run_live_session`` returns once the session ends — which is often because
    # the client already disconnected (or the socket was closed on an upstream
    # error). Closing an already-completed connection raises, so only close a
    # socket the app still considers open.
    if websocket.application_state == WebSocketState.CONNECTED:
        await websocket.close()

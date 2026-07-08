"""Gemini chat agent — runs one assistant turn with server-side tool calling."""
from __future__ import annotations

import logging
from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Any

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.bot.schemas import ChatMessage

logger = logging.getLogger("botler.bot")

# A tool executor is anything exposing ``dispatch(name, args) -> dict`` — both the
# concierge ``BotToolExecutor`` and the sales ``SalesToolExecutor`` qualify.
ToolExecutor = Any

SYSTEM_INSTRUCTION = """\
You are the digital concierge for Le Bon Goût — a warm, friendly host for a \
20-year-old restaurant & pizzeria in Le Bardo, Tunis. You help guests explore \
the menu and place orders.

Rules:
- Use the provided tools for anything about the menu, cart or orders. Never invent \
menu items, prices, sizes or extras — read them from tool results.
- Prices are in Tunisian dinars (DT). Quote the figures the tools return.
- Le Bon Goût serves continental dishes, Tunisian specialties and wood-fired \
pizzas ("quick lunch"). Dine-in, takeaway and delivery available. Open every \
day, 10:00–23:55.
- Keep replies short, warm and natural; this is a chat (and sometimes a phone call).
- Before placing an order, summarise the items, fulfilment (delivery or pickup) and \
total, then place it only after the guest clearly says yes (call place_order with \
confirm=true).
- Payment is on delivery or on pickup (cash or card to the driver / at the counter). \
There is no online card payment.
- If a tool returns an "error" saying the guest must sign in, politely ask them \
to sign in to manage their cart or order (menu questions don't need an account).
- Don't read out internal ids; refer to items by name.
- Always reply in the same language as the guest's latest message.
"""

_MAX_TOOL_HOPS = 6

# Single source of truth for the agent's sampling temperature, applied to both
# the chat (generate_content) and the voice (Live) connections so the concierge
# behaves consistently across channels.
AGENT_TEMPERATURE = 0.4


@dataclass
class ChatTurn:
    reply: str
    tool_calls: list[str] = field(default_factory=list)
    handoff: str | None = None
    order_id: str | None = None


class BotAgent:
    """Thin wrapper around the Gemini client for the text chat turn.

    The system instruction and tool set are injected so one class can back both
    the B2C concierge and the B2B sales assistant.
    """

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        thinking_budget: int = 0,
        system_instruction: str = SYSTEM_INSTRUCTION,
        tools: list[types.FunctionDeclaration] | None = None,
    ) -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model
        self._system_instruction = system_instruction
        self._tools = [types.Tool(function_declarations=tools)] if tools else None
        self._thinking_budget = thinking_budget

    def _config(self) -> types.GenerateContentConfig:
        return types.GenerateContentConfig(
            system_instruction=self._system_instruction,
            tools=self._tools,
            temperature=AGENT_TEMPERATURE,
            # The concierge is tool-driven and doesn't need deep reasoning; a 0
            # budget skips the model's "thinking" phase, the main reply-latency
            # cost on these flash models. Tune via GEMINI_THINKING_BUDGET.
            thinking_config=types.ThinkingConfig(thinking_budget=self._thinking_budget),
        )

    def run_chat(self, messages: list[ChatMessage], executor: ToolExecutor) -> ChatTurn:
        contents: list[types.Content] = [
            types.Content(
                role="model" if m.role == "assistant" else "user",
                parts=[types.Part(text=m.content)],
            )
            for m in messages
        ]

        turn = ChatTurn(reply="")
        for _ in range(_MAX_TOOL_HOPS):
            try:
                response = self._client.models.generate_content(
                    model=self._model, contents=contents, config=self._config()
                )
            except genai_errors.APIError as exc:
                # Upstream Gemini failure (e.g. 503 high-demand, rate limit).
                # Degrade gracefully rather than surfacing a raw 500 to the guest.
                logger.warning("Bot chat Gemini call failed: %s", exc)
                turn.reply = (
                    "Sorry, I'm having a brief problem reaching the kitchen's "
                    "system. Please try again in a moment."
                )
                return turn
            calls = response.function_calls or []
            if not calls:
                turn.reply = (response.text or "").strip() or (
                    "I'm sorry, I didn't catch that — could you rephrase?"
                )
                return turn

            # Record the model's tool-call turn, then execute each call.
            if response.candidates and response.candidates[0].content:
                contents.append(response.candidates[0].content)

            response_parts: list[types.Part] = []
            for call in calls:
                name = call.name or ""
                args = dict(call.args or {})
                result = executor.dispatch(name, args)
                turn.tool_calls.append(name)
                if name == "place_order":
                    if result.get("action") == "handoff_checkout":
                        turn.handoff = "/checkout"
                    if result.get("order_id"):
                        turn.order_id = result["order_id"]
                response_parts.append(
                    types.Part.from_function_response(name=name, response=result)
                )
            contents.append(types.Content(role="user", parts=response_parts))

        # Hop cap hit — ask the model for a final plain answer.
        logger.warning("Bot chat hit tool-hop cap (%d)", _MAX_TOOL_HOPS)
        turn.reply = (
            "Sorry, that took more steps than expected. Could you try again or be "
            "a touch more specific?"
        )
        return turn

    def run_chat_stream(
        self, messages: list[ChatMessage], executor: ToolExecutor
    ) -> Iterator[tuple[str, object]]:
        """Stream one assistant turn token-by-token.

        Yields ``("delta", text)`` for each chunk of the model's natural-language
        reply, then exactly one ``("final", ChatTurn)`` carrying the accumulated
        reply plus tool/handoff/order metadata. Tool-call hops are resolved
        server-side and carry no user-facing text, so only the model's spoken
        turns stream out.
        """
        contents: list[types.Content] = [
            types.Content(
                role="model" if m.role == "assistant" else "user",
                parts=[types.Part(text=m.content)],
            )
            for m in messages
        ]

        turn = ChatTurn(reply="")
        for _ in range(_MAX_TOOL_HOPS):
            text_acc = ""
            calls: list[types.FunctionCall] = []
            # Keep the model's original parts verbatim: function-call parts carry a
            # ``thought_signature`` that Gemini requires back unchanged on the next
            # hop — rebuilding the parts drops it and the follow-up request 400s.
            model_parts: list[types.Part] = []
            try:
                stream = self._client.models.generate_content_stream(
                    model=self._model, contents=contents, config=self._config()
                )
                for chunk in stream:
                    candidate = chunk.candidates[0] if chunk.candidates else None
                    content = candidate.content if candidate else None
                    for part in (content.parts if content and content.parts else []):
                        model_parts.append(part)
                        if part.function_call:
                            calls.append(part.function_call)
                        elif part.text and not getattr(part, "thought", None):
                            text_acc += part.text
                            yield ("delta", part.text)
            except genai_errors.APIError as exc:
                logger.warning("Bot chat (stream) Gemini call failed: %s", exc)
                turn.reply = (
                    "Sorry, I'm having a brief problem reaching the kitchen's "
                    "system. Please try again in a moment."
                )
                yield ("delta", turn.reply)
                yield ("final", turn)
                return

            if not calls:
                turn.reply = text_acc.strip() or (
                    "I'm sorry, I didn't catch that — could you rephrase?"
                )
                if not text_acc.strip():
                    yield ("delta", turn.reply)
                yield ("final", turn)
                return

            # Record the model's tool-call turn (original parts, signatures intact),
            # then execute each call and feed the results back for the next hop.
            contents.append(types.Content(role="model", parts=model_parts))

            response_parts: list[types.Part] = []
            for call in calls:
                name = call.name or ""
                args = dict(call.args or {})
                result = executor.dispatch(name, args)
                turn.tool_calls.append(name)
                if name == "place_order":
                    if result.get("action") == "handoff_checkout":
                        turn.handoff = "/checkout"
                    if result.get("order_id"):
                        turn.order_id = result["order_id"]
                response_parts.append(
                    types.Part.from_function_response(name=name, response=result)
                )
            contents.append(types.Content(role="user", parts=response_parts))

        logger.warning("Bot chat (stream) hit tool-hop cap (%d)", _MAX_TOOL_HOPS)
        turn.reply = (
            "Sorry, that took more steps than expected. Could you try again or be "
            "a touch more specific?"
        )
        yield ("delta", turn.reply)
        yield ("final", turn)


__all__ = ["AGENT_TEMPERATURE", "BotAgent", "ChatTurn", "SYSTEM_INSTRUCTION"]

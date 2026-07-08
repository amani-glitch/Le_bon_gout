"""Gemini Live API bridge for real-time voice calls.

Bridges a browser WebSocket to a Gemini Live session:

  browser mic (PCM16 @16kHz)  ──uplink──▶  Gemini Live
  browser speaker (PCM16 @24kHz) ◀─downlink── Gemini Live (audio + transcripts)

Tool calls are executed server-side via ``BotToolExecutor`` (as the
authenticated user) and the results streamed back to the model. Cart/order
mutations emit a control frame so the SPA refreshes its cached queries.

WebSocket framing
  client → server: binary = raw mic PCM16; text JSON {"type":"text"|"end"}
  server → client: binary = model speech PCM16; text JSON control frames
"""
from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime

from google import genai
from google.genai import types
from starlette.websockets import WebSocket, WebSocketDisconnect

from app.bot.agent import AGENT_TEMPERATURE
from app.bot.tools import MUTATING_TOOLS
from app.schemas.auth import CurrentUser
from app.services.bot_conversation_service import BotConversationService

# Any object exposing ``dispatch(name, args) -> dict`` (concierge or sales executor).
ToolExecutor = object

logger = logging.getLogger("botler.bot.live")


@dataclass
class _CallRecord:
    """Accumulates the call transcript + tool usage for admin history."""

    messages: list[dict] = field(default_factory=list)
    tool_calls: list[str] = field(default_factory=list)
    order_ids: list[str] = field(default_factory=list)

    def add_transcript(self, role: str, text: str) -> None:
        if self.messages and self.messages[-1]["role"] == role:
            self.messages[-1]["content"] += text
        else:
            self.messages.append({"role": role, "content": text})

INPUT_SAMPLE_RATE = 16000  # what the model expects from the mic
INPUT_MIME = f"audio/pcm;rate={INPUT_SAMPLE_RATE}"


def _live_config(
    voice: str,
    *,
    system_instruction: str,
    tools: list[types.FunctionDeclaration],
) -> types.LiveConnectConfig:
    return types.LiveConnectConfig(
        response_modalities=[types.Modality.AUDIO],
        temperature=AGENT_TEMPERATURE,
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice)
            )
        ),
        system_instruction=types.Content(parts=[types.Part(text=system_instruction)]),
        tools=[types.Tool(function_declarations=tools)],
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
    )


async def run_live_session(
    websocket: WebSocket,
    executor: ToolExecutor,
    *,
    api_key: str,
    model: str,
    voice: str,
    system_instruction: str,
    tools: list[types.FunctionDeclaration],
    conversations: BotConversationService | None = None,
    user: CurrentUser | None = None,
    bot_type: str = "concierge",
) -> None:
    client = genai.Client(api_key=api_key)
    record = _CallRecord()
    started_at = datetime.now(UTC)
    conversation_id: str | None = None
    if conversations is not None:
        conversation_id = await asyncio.to_thread(
            conversations.start_call, user, bot_type=bot_type
        )
    try:
        config = _live_config(voice, system_instruction=system_instruction, tools=tools)
        async with client.aio.live.connect(model=model, config=config) as session:
            await _send_json(websocket, {"type": "ready"})
            uplink = asyncio.create_task(_pump_uplink(websocket, session))
            downlink = asyncio.create_task(_pump_downlink(websocket, session, executor, record))
            done, pending = await asyncio.wait(
                {uplink, downlink}, return_when=asyncio.FIRST_COMPLETED
            )
            for task in pending:
                task.cancel()
            for task in done:
                exc = task.exception()
                if exc and not isinstance(exc, WebSocketDisconnect):
                    raise exc
    except WebSocketDisconnect:
        pass
    except Exception as exc:  # surface a friendly error then close
        logger.exception("Live session failed")
        await _send_json(websocket, {"type": "error", "message": str(exc)})
    finally:
        if conversations is not None and conversation_id is not None:
            try:
                await asyncio.to_thread(
                    conversations.finalize_call,
                    conversation_id,
                    messages=record.messages,
                    tool_calls=record.tool_calls,
                    order_ids=record.order_ids,
                    started_at=started_at,
                    ended_at=datetime.now(UTC),
                )
            except Exception:  # pragma: no cover - never fail the call on logging
                logger.exception("Failed to persist call record")


async def _pump_uplink(websocket: WebSocket, session) -> None:
    """Forward mic audio / typed text from the browser to Gemini."""
    while True:
        message = await websocket.receive()
        if message.get("type") == "websocket.disconnect":
            raise WebSocketDisconnect()
        if (data := message.get("bytes")) is not None:
            await session.send_realtime_input(
                audio=types.Blob(data=data, mime_type=INPUT_MIME)
            )
        elif (text := message.get("text")) is not None:
            try:
                payload = json.loads(text)
            except json.JSONDecodeError:
                continue
            kind = payload.get("type")
            if kind == "text" and payload.get("text"):
                await session.send_client_content(
                    turns=types.Content(
                        role="user", parts=[types.Part(text=payload["text"])]
                    )
                )
            elif kind == "end":
                await session.send_realtime_input(audio_stream_end=True)


async def _pump_downlink(
    websocket: WebSocket, session, executor: ToolExecutor, record: _CallRecord
) -> None:
    """Stream model audio, transcripts and tool calls back to the browser.

    ``session.receive()`` yields a single model turn and then stops (it breaks on
    ``turn_complete``), so it must be re-subscribed for each subsequent turn. The
    outer loop keeps the downlink alive for the whole call; it ends only when the
    underlying session/websocket closes (``receive()`` then raises, unwinding the
    task and tearing the session down).
    """
    while True:
        async for message in session.receive():
            if message.data:
                await websocket.send_bytes(message.data)

            if message.tool_call and message.tool_call.function_calls:
                await _handle_tool_calls(
                    websocket, session, executor, message.tool_call.function_calls, record
                )

            content = message.server_content
            if content:
                if content.output_transcription and content.output_transcription.text:
                    text = content.output_transcription.text
                    record.add_transcript("assistant", text)
                    await _send_json(
                        websocket, {"type": "transcript", "role": "assistant", "text": text}
                    )
                if content.input_transcription and content.input_transcription.text:
                    text = content.input_transcription.text
                    record.add_transcript("user", text)
                    await _send_json(
                        websocket, {"type": "transcript", "role": "user", "text": text}
                    )
                if content.interrupted:
                    await _send_json(websocket, {"type": "interrupted"})
                if content.turn_complete:
                    await _send_json(websocket, {"type": "turn_complete"})


async def _handle_tool_calls(
    websocket: WebSocket, session, executor: ToolExecutor, calls, record: _CallRecord
) -> None:
    responses: list[types.FunctionResponse] = []
    invalidate: set[str] = set()
    handoff: str | None = None
    order_id: str | None = None
    for call in calls:
        name = call.name or ""
        args = dict(call.args or {})
        # Tools touch Firestore (blocking) — run off the event loop. ``dispatch``
        # already turns expected failures into ``{"error": ...}``; this guard is a
        # backstop so an unexpected failure at the connection layer feeds the model
        # a graceful response instead of tearing down the live call.
        try:
            result = await asyncio.to_thread(executor.dispatch, name, args)
        except Exception:  # pragma: no cover - defensive
            logger.exception("Live tool '%s' failed", name)
            result = {
                "error": (
                    "Sorry, something went wrong on our side. Please try again, or "
                    "finish on the website."
                )
            }
        record.tool_calls.append(name)
        if name in MUTATING_TOOLS:
            invalidate.update({"cart", "orders"})
        if name == "place_order":
            if result.get("action") == "handoff_checkout":
                handoff = "/checkout"
            if result.get("order_id"):
                order_id = result["order_id"]
                record.order_ids.append(result["order_id"])
        responses.append(
            types.FunctionResponse(id=call.id, name=name, response=result)
        )
    await session.send_tool_response(function_responses=responses)
    if invalidate or handoff or order_id:
        await _send_json(
            websocket,
            {
                "type": "state",
                "invalidate": sorted(invalidate),
                "handoff": handoff,
                "order_id": order_id,
            },
        )


async def _send_json(websocket: WebSocket, payload: dict) -> None:
    try:
        await websocket.send_text(json.dumps(payload))
    except (WebSocketDisconnect, RuntimeError):
        pass

import { env } from "@/app/config/env";
import { apiClient } from "@/lib/apiClient";

/** Which assistant profile answers: B2C ordering concierge or B2B sales bot. */
export type Assistant = "concierge" | "sales";

export interface BotChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface BotChatResponse {
  reply: string;
  conversation_id?: string | null;
  tool_calls: string[];
  handoff?: string | null;
  order_id?: string | null;
}

/** Tools that change server-side state — refresh cart/orders after they run. */
export const MUTATING_TOOLS = new Set([
  "add_to_cart",
  "update_cart_item",
  "remove_cart_item",
  "clear_cart",
  "place_order",
]);

export function touchedState(toolCalls: string[]): boolean {
  return toolCalls.some((t) => MUTATING_TOOLS.has(t));
}

export async function sendBotChat(
  messages: BotChatMessage[],
  conversationId?: string | null,
  assistant: Assistant = "concierge",
): Promise<BotChatResponse> {
  return (
    await apiClient.post<BotChatResponse>("/bot/chat", {
      messages,
      conversation_id: conversationId ?? null,
      assistant,
    })
  ).data;
}

/** Metadata delivered on the final SSE frame, once the reply has fully streamed. */
export interface BotChatFinal {
  conversation_id?: string | null;
  tool_calls: string[];
  handoff?: string | null;
  order_id?: string | null;
}

export interface BotStreamHandlers {
  /** Called with each chunk of the assistant's reply as it arrives. */
  onDelta: (text: string) => void;
  /** Called once when the turn completes, with tool/handoff/order metadata. */
  onFinal: (final: BotChatFinal) => void;
}

/**
 * Stream a chat turn via Server-Sent Events. Uses the Fetch streaming API
 * (axios can't stream response bodies in the browser); the session cookie is
 * sent via ``credentials: "include"``, matching ``apiClient``.
 */
export async function streamBotChat(
  messages: BotChatMessage[],
  conversationId: string | null | undefined,
  handlers: BotStreamHandlers,
  signal?: AbortSignal,
  assistant: Assistant = "concierge",
): Promise<void> {
  const res = await fetch(`${env.apiUrl}/bot/chat/stream`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, conversation_id: conversationId ?? null, assistant }),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`Chat request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE frames are separated by a blank line; keep the trailing partial.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data) continue;
      const evt = JSON.parse(data) as
        | { type: "delta"; text: string }
        | ({ type: "final" } & BotChatFinal);
      if (evt.type === "delta") handlers.onDelta(evt.text);
      else if (evt.type === "final") handlers.onFinal(evt);
    }
  }
}

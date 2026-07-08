import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CornerDownLeft, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/apiClient";
import { cn } from "@/lib/cn";

import { type Assistant, type BotChatMessage, streamBotChat, touchedState } from "./botApi";

const DEFAULT_GREETING =
  "Hello — welcome to Le Bon Gout! Ask me about the menu, and I can build your order or place it for you. How may I help?";

export interface ChatPanelProps {
  /** Which assistant answers. "sales" disables the B2C cart/checkout handoffs. */
  assistant?: Assistant;
  /** Opening assistant bubble (not sent as a real turn). */
  greeting?: string;
  /** Optional starter prompts shown as tappable chips before the first reply. */
  suggestions?: string[];
  placeholder?: string;
  thinkingLabel?: string;
}

export function ChatPanel({
  assistant = "concierge",
  greeting = DEFAULT_GREETING,
  suggestions = [],
  placeholder = "Ask about the menu or place an order…",
  thinkingLabel = "Le Bon Gout is thinking…",
}: ChatPanelProps = {}) {
  // Stable greeting identity so we can exclude it from the history we send.
  const greetingRef = useRef<BotChatMessage>({ role: "assistant", content: greeting });
  const [messages, setMessages] = useState<BotChatMessage[]>([greetingRef.current]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const conversationId = useRef<string | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    let acc = "";
    try {
      // Send the conversation minus the local greeting (it isn't a real turn).
      const history = next.filter((m) => m !== greetingRef.current);
      await streamBotChat(
        history,
        conversationId.current,
        {
          onDelta: (text) => {
            const first = acc.length === 0;
            acc += text;
            setMessages((prev) => {
              // First token opens a fresh assistant bubble; the rest grow it.
              if (first) return [...prev, { role: "assistant", content: acc }];
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: acc };
              return copy;
            });
          },
          onFinal: (final) => {
            conversationId.current = final.conversation_id ?? conversationId.current;
            // Cart/order/checkout handoffs only apply to the B2C concierge.
            if (assistant === "concierge") {
              if (touchedState(final.tool_calls)) {
                qc.invalidateQueries({ queryKey: ["cart"] });
                qc.invalidateQueries({ queryKey: ["orders"] });
              }
              if (final.order_id) {
                toast.success(`Order ${final.order_id} placed`, {
                  action: {
                    label: "Track",
                    onClick: () => navigate(`/orders/${final.order_id}`),
                  },
                });
              }
              if (final.handoff) {
                toast.message("Taking you to checkout to pay by card…");
                setTimeout(() => navigate(final.handoff as string), 600);
              }
            }
          },
        },
        undefined,
        assistant,
      );
    } catch (e) {
      const msg = apiErrorMessage(e, "Sorry, I couldn't reach the assistant.");
      // Keep whatever streamed so far; only add an error bubble if nothing did.
      if (!acc) setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setBusy(false);
    }
  }

  const showSuggestions = suggestions.length > 0 && messages.length === 1 && !busy;

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-fg"
                  : "bg-surface-2 text-text",
              )}
            >
              {m.content}
            </div>
          </motion.div>
        ))}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3.5 py-2 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> {thinkingLabel}
            </div>
          </div>
        )}

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                className="rounded-full border border-border bg-surface-1 px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary/50 hover:text-text focus-ring"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={placeholder}
            className="max-h-28 flex-1 resize-none rounded-ctl border border-border bg-surface-1 px-3 py-2 text-sm text-text outline-none focus-ring placeholder:text-text-subtle"
          />
          <button
            onClick={() => void send()}
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl bg-primary text-primary-fg transition disabled:opacity-40 focus-ring"
          >
            <CornerDownLeft className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mic, PhoneCall, PhoneOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

import { type Assistant } from "./botApi";
import { useVoiceCall } from "./useVoiceCall";

export interface CallPanelProps {
  assistant?: Assistant;
  idleTitle?: string;
  idleHint?: string;
}

export function CallPanel({
  assistant = "concierge",
  idleTitle = "Call Le Bon Gout",
  idleHint = "Speak naturally — ask about the menu or place an order by voice.",
}: CallPanelProps = {}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { status, transcript, isSpeaking, error, start, stop } = useVoiceCall({
    assistant,
    onInvalidate: (keys) => {
      if (keys.includes("cart")) qc.invalidateQueries({ queryKey: ["cart"] });
      if (keys.includes("orders")) qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onHandoff: (path) => {
      toast.message("Taking you to checkout to pay by card…");
      stop();
      setTimeout(() => navigate(path), 600);
    },
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  const active = status === "live" || status === "connecting";

  return (
    <div className="flex h-full flex-col items-center justify-between p-5">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          {active && (
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/30"
              animate={{ scale: isSpeaking ? [1, 1.35, 1] : [1, 1.12, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: isSpeaking ? 1 : 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <div
            className={cn(
              "relative flex h-24 w-24 items-center justify-center rounded-full text-primary-fg transition-colors",
              active ? "bg-primary shadow-glow" : "bg-surface-2 text-text-muted",
            )}
          >
            <Mic className="h-9 w-9" />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-text">
            {status === "idle" && idleTitle}
            {status === "connecting" && "Connecting…"}
            {status === "live" && (isSpeaking ? "Le Bon Gout is speaking…" : "Listening…")}
            {status === "error" && "Call ended"}
          </p>
          <p className="mt-1 max-w-xs text-xs text-text-muted">
            {status === "idle" ? idleHint : error ?? "Your microphone is live."}
          </p>
        </div>
      </div>

      {transcript.length > 0 && (
        <div
          ref={scrollRef}
          className="mb-4 max-h-32 w-full space-y-1.5 overflow-y-auto rounded-ctl border border-border bg-surface-1 p-3 text-xs"
        >
          {transcript.map((t, i) => (
            <p key={i} className={t.role === "user" ? "text-text" : "text-text-muted"}>
              <span className="font-semibold">{t.role === "user" ? "You" : "Le Bon Gout"}: </span>
              {t.text}
            </p>
          ))}
        </div>
      )}

      {active ? (
        <Button variant="danger" className="w-full" onClick={stop}>
          <PhoneOff className="h-[18px] w-[18px]" /> End call
        </Button>
      ) : (
        <Button className="w-full" onClick={() => void start()}>
          <PhoneCall className="h-[18px] w-[18px]" /> Start call
        </Button>
      )}
    </div>
  );
}

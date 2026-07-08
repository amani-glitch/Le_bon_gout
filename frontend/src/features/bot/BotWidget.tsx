import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Phone, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { useLangStore } from "@/i18n/langStore";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";

import { CallPanel } from "./CallPanel";
import { ChatPanel } from "./ChatPanel";

type Tab = "chat" | "call";

export function BotWidget() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-24 right-5 z-[60] flex h-[560px] max-h-[78vh] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-bg-elev shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-fg">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-text">{t.bot.name}</p>
                  <p className="text-[11px] text-text-muted">{t.app.bot.concierge}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t.app.bot.close}
                className="inline-flex h-8 w-8 items-center justify-center rounded-ctl text-text-muted hover:bg-surface-2 hover:text-text focus-ring"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </header>

            <div className="flex gap-1 border-b border-border px-3 py-2">
              {(["chat", "call"] as Tab[]).map((tab2) => (
                <button
                  key={tab2}
                  onClick={() => setTab(tab2)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-ctl py-1.5 text-sm font-medium transition-colors",
                    tab === tab2
                      ? "bg-surface-2 text-text"
                      : "text-text-muted hover:text-text",
                  )}
                >
                  {tab2 === "chat" ? <MessageSquare className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                  {tab2 === "chat" ? t.app.bot.chat : t.app.bot.call}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1">
              {/* Keep both mounted so a call survives tab switches; re-key on
                  language change so the greeting/labels refresh. */}
              <div className={cn("h-full", tab === "chat" ? "block" : "hidden")}>
                <ChatPanel
                  key={`chat-${lang}`}
                  greeting={t.bot.greeting}
                  suggestions={t.bot.suggestions}
                  placeholder={t.bot.placeholder}
                  thinkingLabel={t.bot.thinking}
                />
              </div>
              <div className={cn("h-full", tab === "call" ? "block" : "hidden")}>
                <CallPanel
                  key={`call-${lang}`}
                  idleTitle={t.bot.callIdleTitle}
                  idleHint={t.bot.callIdleHint}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t.app.bot.closeConcierge : t.app.bot.openConcierge}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-glow focus-ring"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "x" : "chat"}
            initial={{ opacity: 0, rotate: -30 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 30 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </>
  );
}

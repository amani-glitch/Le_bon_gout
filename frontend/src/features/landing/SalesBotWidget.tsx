import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Phone, X } from "lucide-react";
import { useState } from "react";

import { CallPanel } from "@/features/bot/CallPanel";
import { ChatPanel } from "@/features/bot/ChatPanel";
import { useLangStore } from "@/i18n/langStore";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";

import { useSalesBotStore } from "./salesBotStore";

type Tab = "chat" | "call";

export function SalesBotWidget() {
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const { open, setOpen } = useSalesBotStore();
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
            className="fixed bottom-24 right-5 z-[60] flex h-[560px] max-h-[78vh] w-[min(390px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-bg-elev shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/10 to-transparent px-4 py-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/lebongout-hero.jpg"
                  alt="Le Bon Gout"
                  className="h-9 w-9 rounded-full object-cover ring-1 ring-primary/40"
                />
                <div>
                  <p className="text-sm font-semibold text-text">{t.bot.name}</p>
                  <p className="text-[11px] text-text-muted">{t.bot.role}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-ctl text-text-muted hover:bg-surface-2 hover:text-text focus-ring"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </header>

            <div className="flex gap-1 border-b border-border px-3 py-2">
              {(["chat", "call"] as Tab[]).map((tb) => (
                <button
                  key={tb}
                  onClick={() => setTab(tb)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-ctl py-1.5 text-sm font-medium transition-colors",
                    tab === tb ? "bg-surface-2 text-text" : "text-text-muted hover:text-text",
                  )}
                >
                  {tb === "chat" ? <MessageSquare className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                  {tb === "chat" ? t.bot.chat : t.bot.call}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1">
              {/* Keep both mounted so a call survives tab switches; re-key on language
                  change so the greeting/labels refresh. */}
              <div className={cn("h-full", tab === "chat" ? "block" : "hidden")}>
                <ChatPanel
                  key={`chat-${lang}`}
                  assistant="sales"
                  greeting={t.bot.greeting}
                  suggestions={t.bot.suggestions}
                  placeholder={t.bot.placeholder}
                  thinkingLabel={t.bot.thinking}
                />
              </div>
              <div className={cn("h-full", tab === "call" ? "block" : "hidden")}>
                <CallPanel
                  key={`call-${lang}`}
                  assistant="sales"
                  idleTitle={t.bot.callIdleTitle}
                  idleHint={t.bot.callIdleHint}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        aria-label={open ? t.app.bot.closeConcierge : t.app.bot.openConcierge}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary shadow-glow focus-ring"
      >
        {/* Gentle attention pulse when closed. */}
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/40"
            animate={{ scale: [1, 1.45, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ opacity: 0, rotate: -30 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 30 }}
              transition={{ duration: 0.15 }}
              className="text-primary-fg"
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.img
              key="avatar"
              src="/images/lebongout-hero.jpg"
              alt="Le Bon Gout"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              className="relative h-14 w-14 rounded-full object-cover"
            />
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

import { motion, useReducedMotion } from "framer-motion";
import { MessageSquare } from "lucide-react";

import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";

import { useSalesBotStore } from "./salesBotStore";

/**
 * Eye-catching CTA that opens the sales chat widget. Features the Botler
 * avatar, a sweeping shimmer, a soft breathing glow and a live "online"
 * indicator to maximise the bot's visibility. Motion stills under
 * prefers-reduced-motion.
 */
export function DiscussButton({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  const t = useT();
  const setOpen = useSalesBotStore((s) => s.setOpen);
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={() => setOpen(true)}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative inline-flex items-center gap-3 overflow-hidden rounded-full font-semibold text-primary-fg shadow-glow focus-ring",
        "bg-gradient-to-r from-[#f0b852] via-[#f6c970] to-[#e0922f]",
        size === "lg" ? "py-3.5 pl-3.5 pr-6 text-base" : "py-2.5 pl-2.5 pr-5 text-sm",
        className,
      )}
    >
      {/* breathing glow ring */}
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/50"
          animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {/* sweeping shimmer on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 to-transparent transition-transform duration-700 group-hover:translate-x-full"
      />

      <span className="relative flex items-center">
        <span className="relative inline-flex">
          <img
            src="/images/lebongout-hero.jpg"
            alt=""
            aria-hidden
            className={cn(
              "rounded-full bg-white/20 object-cover ring-2 ring-white/60",
              size === "lg" ? "h-9 w-9" : "h-7 w-7",
            )}
          />
          {/* live status dot */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            {!reduce && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </span>
        </span>
      </span>

      <span className="relative flex flex-col items-start leading-tight">
        <span className="flex items-center gap-1.5">
          <MessageSquare className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} />
          {t.discuss.button}
        </span>
      </span>
    </motion.button>
  );
}

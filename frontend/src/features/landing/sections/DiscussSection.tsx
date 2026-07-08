import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { useT } from "@/i18n/useT";

import { DiscussButton } from "../DiscussButton";

/** Image-backed engagement band that funnels visitors straight into the bot. */
export function DiscussSection() {
  const t = useT();
  return (
    <section className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-card border border-border"
      >
        {/* Le Bon Gout interior ambiance */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/lebongout-discuss.jpg)" }}
        />
        {/* legibility gradient */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(8,10,18,0.92) 8%, rgba(8,10,18,0.72) 45%, rgba(8,10,18,0.35) 100%)",
          }}
        />
        <div className="relative px-7 py-12 md:px-14 md:py-16">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {t.discuss.eyebrow}
          </p>
          <h2 className="mt-3 max-w-xl font-display text-3xl text-white md:text-4xl">
            {t.discuss.title}
          </h2>
          <p className="mt-4 max-w-md text-white/75">{t.discuss.subtitle}</p>
          <div className="mt-8 flex items-center gap-4">
            <DiscussButton size="lg" />
            <span className="hidden items-center gap-2 text-sm text-white/70 sm:flex">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              {t.discuss.badge}
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

import { motion } from "framer-motion";
import { ArrowRight, Phone, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { AmberOrb } from "@/components/brand/AmberOrb";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";

import { DiscussButton } from "../DiscussButton";
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from "../constants";

export function HeroSection() {
  const t = useT();
  return (
    <section className="relative -mx-6 grid items-center gap-10 overflow-hidden rounded-b-[2.5rem] px-6 py-12 md:grid-cols-2 md:py-20">
      {/* Le Bon Gout storefront ambiance, faded so copy stays legible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-[0.18] dark:opacity-30"
        style={{ backgroundImage: "url(/images/lebongout-hero-bg.jpg)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(100deg, var(--bg) 18%, rgba(0,0,0,0) 65%), linear-gradient(to top, var(--bg), rgba(0,0,0,0) 40%)",
        }}
      />
      <AmberOrb className="-left-20 top-0" size={360} />
      <div className="relative">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <Sparkles className="h-3.5 w-3.5" /> {t.hero.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] md:text-6xl">
          {t.hero.title1} <span className="text-primary">{t.hero.title2}</span>
        </h1>
        <p className="mt-5 max-w-md text-lg text-text-muted">{t.hero.subtitle}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" asChild>
            <Link to="/menu">
              {t.hero.ctaPrimary} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={`tel:${CONTACT_PHONE_TEL}`}>
              <Phone className="h-4 w-4" /> {t.hero.ctaSecondary}
            </a>
          </Button>
          <DiscussButton size="lg" />
        </div>
        <p className="mt-4 text-sm text-text-subtle">{CONTACT_PHONE}</p>
      </div>

      <div className="relative flex min-h-[18rem] items-center justify-center md:min-h-[24rem]">
        <div
          aria-hidden
          className="pointer-events-none absolute h-72 w-72 rounded-full md:h-96 md:w-96"
          style={{
            background:
              "radial-gradient(circle, rgba(226,59,50,0.30), rgba(229,101,75,0.12) 45%, transparent 72%)",
            filter: "blur(20px)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md overflow-hidden rounded-card border border-border shadow-card"
        >
          <img
            src="/images/lebongout-hero.jpg"
            alt="Le Bon Goût — Le Bardo"
            className="w-full object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}

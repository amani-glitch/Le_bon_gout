import { motion } from "framer-motion";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { PizzaSlice } from "@/components/brand/FoodIcons";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";

export function ShowcaseSection() {
  const t = useT();
  return (
    <section className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-card border border-border bg-surface p-8 md:p-12"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {t.showcase.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">{t.showcase.title}</h2>
            <p className="mt-4 max-w-md text-text-muted">{t.showcase.text}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/menu">
                  {t.showcase.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="#locations">
                  <MapPin className="h-4 w-4" /> {t.showcase.ctaAdmin}
                </a>
              </Button>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-card border border-border shadow-card">
              <img
                src="/images/lebongout-showcase.jpg"
                alt="Salle Le Bon Goût — Le Bardo"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            {/* floating slogan chip */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-full border border-border bg-bg-elev/95 px-3 py-2 shadow-card backdrop-blur"
            >
              <PizzaSlice className="h-7 w-7" />
              <span className="pr-1 text-sm font-semibold">Feu de bois</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  MapPin,
  MessageSquare,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";

export function CapabilitiesSection() {
  const t = useT();
  const items: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: ShoppingBag, ...t.capabilities.items.orders },
    { icon: Truck, ...t.capabilities.items.payments },
    { icon: UtensilsCrossed, ...t.capabilities.items.storefront },
    { icon: MapPin, ...t.capabilities.items.dashboard },
    { icon: Clock, ...t.capabilities.items.chat },
    { icon: MessageSquare, ...t.capabilities.items.voice },
  ];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl md:text-4xl">{t.capabilities.title}</h2>
        <p className="mt-3 text-text-muted">{t.capabilities.subtitle}</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, text }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
            className="group relative overflow-hidden rounded-card border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/15 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
            />
            <div className="relative mb-4 flex h-11 w-11 items-center justify-center rounded-ctl bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="relative font-display text-lg">{title}</h3>
            <p className="relative mt-1.5 text-sm text-text-muted">{text}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Button variant="outline" size="lg" asChild>
          <Link to="/menu">
            {t.capabilities.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

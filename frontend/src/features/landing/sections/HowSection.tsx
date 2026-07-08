import { motion } from "framer-motion";
import { ShoppingCart, Truck, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useT } from "@/i18n/useT";

export function HowSection() {
  const t = useT();
  const steps: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: UtensilsCrossed, ...t.how.steps.discovery },
    { icon: ShoppingCart, ...t.how.steps.build },
    { icon: Truck, ...t.how.steps.launch },
  ];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl md:text-4xl">{t.how.title}</h2>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="relative text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 font-display text-lg">{title}</h3>
            <p className="mt-1.5 text-sm text-text-muted">{text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

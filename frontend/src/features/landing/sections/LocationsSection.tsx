import { motion } from "framer-motion";
import { Clock, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";

import { BRANCHES } from "../constants";

export function LocationsSection() {
  const t = useT();

  return (
    <section id="locations" className="scroll-mt-20 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {t.locations.eyebrow}
        </p>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">{t.locations.title}</h2>
        <p className="mt-3 text-text-muted">{t.locations.subtitle}</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {BRANCHES.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className={cn(
              "relative flex flex-col rounded-card bg-surface p-6",
              b.highlight ? "border-2 border-primary" : "border border-border",
            )}
          >
            {b.highlight && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary-fg">
                {b.area.split(",")[0]}
              </span>
            )}
            <h3 className="font-display text-lg">{b.name}</h3>
            <p className="mt-2 flex items-start gap-2 text-sm text-text-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {b.address}
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-text-muted">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              {b.hours}
            </p>
            <Button variant={b.highlight ? "primary" : "outline"} className="mt-5 w-full" asChild>
              <a href={`tel:${b.phoneTel}`}>
                <Phone className="h-4 w-4" /> {t.locations.callCta} · {b.phone}
              </a>
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

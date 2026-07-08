import { motion } from "framer-motion";
import { Pizza } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/brand/EmptyState";
import { ProductCardSkeleton } from "@/components/brand/Skeleton";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";

import { useCategories, useProducts } from "./menuApi";
import { ProductCard } from "./ProductCard";

export function MenuPage() {
  const t = useT();
  const [active, setActive] = useState<string | undefined>(undefined);
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts(active);

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          {t.menu.eyebrow}
        </p>
        <h1 className="mt-1 font-display text-3xl">{t.menu.title}</h1>
        <p className="mt-1 text-text-muted">{t.menu.subtitle}</p>
      </div>

      <div className="sticky top-[68px] z-30 -mx-2 mb-6 flex gap-2 overflow-x-auto px-2 py-2">
        <CategoryPill label={t.menu.all} active={!active} onClick={() => setActive(undefined)} />
        {categories?.map((c) => (
          <CategoryPill
            key={c.id}
            label={c.name}
            active={active === c.id}
            onClick={() => setActive(c.id)}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Pizza className="h-6 w-6" />}
          title={t.menu.empty.title}
          description={t.menu.empty.description}
        />
      )}
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-text"
          : "border-border bg-surface text-text-muted hover:text-text",
      )}
    >
      {label}
    </button>
  );
}

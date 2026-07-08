import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { useT } from "@/i18n/useT";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/types/api";

import { CustomizeModal } from "./CustomizeModal";

export function ProductCard({ product }: { product: Product }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const fromPrice = product.sizes.length
    ? Math.min(...product.sizes.map((s) => s.price_cents))
    : product.base_price_cents;
  const hasOptions = product.sizes.length > 1 || product.topping_groups.length > 0;

  return (
    <>
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-shadow hover:shadow-glow"
      >
        <button
          onClick={() => setOpen(true)}
          className="relative aspect-[4/3] overflow-hidden text-left"
        >
          <img
            src={product.image_url ?? "/images/lebongout-hero.jpg"}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/images/lebongout-hero.jpg";
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3">
            <FavoriteButton product={product} />
          </div>
        </button>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg leading-tight">{product.name}</h3>
          <p className="mt-1 line-clamp-2 flex-1 text-sm text-text-muted">
            {product.description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-text-muted">
              {product.sizes.length > 1 ? t.menu.from : ""}
              <span className="font-display text-lg tnum text-text">
                {formatMoney(fromPrice)}
              </span>
            </span>
            <Button size="sm" onClick={() => setOpen(true)}>
              {hasOptions ? t.menu.customize : <Plus className="h-4 w-4" />}
              {hasOptions ? "" : t.menu.add}
            </Button>
          </div>
        </div>
      </motion.article>

      {open && <CustomizeModal product={product} open={open} onOpenChange={setOpen} />}
    </>
  );
}

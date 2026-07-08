import { motion } from "framer-motion";
import { Heart } from "lucide-react";

import { useAuth } from "@/features/auth/useAuth";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";
import type { Product } from "@/types/api";

import { useAddFavorite, useFavorites, useRemoveFavorite } from "./favoritesApi";

/** Heart toggle for a product's default (smallest size, no toppings) configuration. */
export function FavoriteButton({ product }: { product: Product }) {
  const t = useT();
  const { isAuthenticated } = useAuth();
  const { data: favorites } = useFavorites(isAuthenticated);
  const add = useAddFavorite();
  const remove = useRemoveFavorite();

  const existing = favorites?.find((f) => f.product_id === product.id);
  const active = !!existing;

  if (!isAuthenticated) return null;

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e) => {
        e.stopPropagation();
        if (existing) {
          remove.mutate(existing.id);
        } else {
          add.mutate({
            product_id: product.id,
            size_id: product.sizes[0]?.id ?? "",
            topping_ids: [],
          });
        }
      }}
      aria-label={active ? t.favorites.removeButtonAria : t.favorites.addAria}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/80 backdrop-blur transition-colors hover:border-border-strong"
    >
      <Heart
        className={cn(
          "h-[18px] w-[18px] transition-colors",
          active ? "fill-danger text-danger" : "text-text-muted",
        )}
      />
    </motion.button>
  );
}

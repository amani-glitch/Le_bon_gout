import { AnimatePresence, motion } from "framer-motion";
import { Heart, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/brand/EmptyState";
import { Skeleton } from "@/components/brand/Skeleton";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";

import { useFavorites, useFavoriteToCart, useRemoveFavorite } from "./favoritesApi";

export function FavoritesPage() {
  const t = useT();
  const { data: favorites, isLoading } = useFavorites();
  const toCart = useFavoriteToCart();
  const remove = useRemoveFavorite();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 font-display text-3xl">{t.favorites.title}</h1>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : favorites && favorites.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {favorites.map((fav) => (
              <motion.div
                key={fav.id}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-4 rounded-card border border-border bg-surface p-3"
              >
                <img
                  src={fav.image_url ?? "/images/lebongout-hero.jpg"}
                  alt=""
                  className="h-16 w-16 rounded-ctl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{fav.name}</p>
                  <p className="truncate text-xs text-text-muted">
                    {fav.size_name}
                    {fav.toppings.length > 0 &&
                      ` · ${fav.toppings.map((t) => t.name).join(", ")}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={toCart.isPending && toCart.variables === fav.id}
                    onClick={() => toCart.mutate(fav.id)}
                  >
                    <Plus className="h-4 w-4" /> {t.favorites.add}
                  </Button>
                  <button
                    onClick={() => remove.mutate(fav.id)}
                    className="rounded-ctl p-2 text-text-subtle hover:text-danger"
                    aria-label={t.favorites.removeAria}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title={t.favorites.emptyTitle}
          description={t.favorites.emptyDescription}
          action={
            <Button asChild>
              <Link to="/menu">{t.favorites.browseMenu}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

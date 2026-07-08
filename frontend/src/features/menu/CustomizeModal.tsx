import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/useAuth";
import { useAddToCart } from "@/features/cart/cartApi";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/types/api";

export function CustomizeModal({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const addToCart = useAddToCart();

  const [sizeId, setSizeId] = useState(product.sizes[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];

  const unitPrice = useMemo(() => {
    const toppingTotal = product.topping_groups
      .flatMap((g) => g.options)
      .filter((o) => selected.has(o.id))
      .reduce((sum, o) => sum + o.price_cents, 0);
    return (size?.price_cents ?? 0) + toppingTotal;
  }, [product, selected, size]);

  function toggleTopping(id: string, group: Product["topping_groups"][number]) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      const inGroup = group.options.filter((o) => next.has(o.id)).length;
      if (group.max && inGroup >= group.max) {
        if (!group.multi_select) {
          group.options.forEach((o) => next.delete(o.id));
        } else {
          return prev; // at max — ignore
        }
      }
      next.add(id);
      return next;
    });
  }

  function handleAdd() {
    if (!isAuthenticated) {
      onOpenChange(false);
      navigate("/login?next=/menu");
      return;
    }
    addToCart.mutate(
      {
        product_id: product.id,
        size_id: sizeId,
        topping_ids: [...selected],
        quantity,
        notes: notes.trim() || null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  const hasSizes = product.sizes.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <div className="relative h-44 overflow-hidden rounded-t-modal">
          <img
            src={product.image_url ?? "/images/lebongout-hero.jpg"}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
        </div>
        <div className="space-y-5 p-6">
          <div>
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription className="mt-1">{product.description}</DialogDescription>
          </div>

          {hasSizes && (
            <div>
              <p className="mb-2 text-sm font-medium text-text-muted">{t.customize.size}</p>
              <div className="grid grid-cols-3 gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSizeId(s.id)}
                    className={cn(
                      "rounded-ctl border px-3 py-2.5 text-center transition-all",
                      sizeId === s.id
                        ? "border-primary bg-primary/10 text-text"
                        : "border-border text-text-muted hover:border-border-strong",
                    )}
                  >
                    <span className="block text-sm font-medium">{s.name}</span>
                    <span className="block text-xs tnum text-text-subtle">
                      {formatMoney(s.price_cents)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.topping_groups.map((group) => (
            <div key={group.id}>
              <p className="mb-2 text-sm font-medium text-text-muted">
                {group.name}
                {group.max ? (
                  <span className="ml-1 text-xs text-text-subtle">({t.customize.upTo} {group.max})</span>
                ) : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const active = selected.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleTopping(opt.id, group)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-all",
                        active
                          ? "border-primary bg-primary/10 text-text"
                          : "border-border text-text-muted hover:border-border-strong",
                      )}
                    >
                      {opt.name}
                      {opt.price_cents > 0 && (
                        <span className="ml-1.5 text-xs tnum text-text-subtle">
                          +{formatMoney(opt.price_cents)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <p className="mb-2 text-sm font-medium text-text-muted">{t.customize.specialInstructions}</p>
            <Textarea
              rows={2}
              placeholder={t.customize.instructionsPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center gap-3 border-t border-border bg-surface/95 p-4 backdrop-blur">
          <div className="flex items-center gap-1 rounded-ctl border border-border">
            <button
              className="px-3 py-2.5 text-text-muted hover:text-text disabled:opacity-40"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-medium tnum">{quantity}</span>
            <button
              className="px-3 py-2.5 text-text-muted hover:text-text"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button className="flex-1" loading={addToCart.isPending} onClick={handleAdd}>
            {t.customize.addToTray} · {formatMoney(unitPrice * quantity)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

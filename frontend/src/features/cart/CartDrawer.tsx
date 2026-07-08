import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/useAuth";
import { useT } from "@/i18n/useT";
import { formatMoney } from "@/lib/format";
import { useUiStore } from "@/store/uiStore";

import { useCart, useRemoveCartItem, useUpdateCartItem } from "./cartApi";

export function CartDrawer() {
  const t = useT();
  const { cartOpen, setCartOpen } = useUiStore();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data: cart } = useCart(isAuthenticated);
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const items = cart?.items ?? [];
  const close = () => setCartOpen(false);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-bg-elev shadow-card"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-xl">{t.cart.title}</h2>
              <button
                onClick={close}
                className="rounded-full p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text focus-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ShoppingBag className="h-7 w-7" />
                  </div>
                  <p className="font-display text-lg">{t.cart.empty}</p>
                  <p className="mt-1 text-sm text-text-muted">{t.cart.emptyHint}</p>
                  <Button
                    variant="secondary"
                    className="mt-5"
                    onClick={() => {
                      close();
                      navigate("/menu");
                    }}
                  >
                    {t.cart.browseMenu}
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.line_id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-3 rounded-card border border-border bg-surface p-3"
                      >
                        <img
                          src={item.image_url ?? "/images/lebongout-hero.jpg"}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-ctl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-medium">{item.name}</p>
                            <button
                              onClick={() => removeItem.mutate(item.line_id)}
                              className="text-text-subtle hover:text-danger"
                              aria-label={t.cart.remove}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="truncate text-xs text-text-muted">
                            {item.size_name}
                            {item.toppings.length > 0 &&
                              ` · ${item.toppings.map((t) => t.name).join(", ")}`}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-ctl border border-border">
                              <button
                                className="px-2 py-1 text-text-muted hover:text-text disabled:opacity-40"
                                disabled={item.quantity <= 1}
                                onClick={() =>
                                  updateItem.mutate({
                                    lineId: item.line_id,
                                    payload: { quantity: item.quantity - 1 },
                                  })
                                }
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm tnum">{item.quantity}</span>
                              <button
                                className="px-2 py-1 text-text-muted hover:text-text"
                                onClick={() =>
                                  updateItem.mutate({
                                    lineId: item.line_id,
                                    payload: { quantity: item.quantity + 1 },
                                  })
                                }
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="font-semibold tnum text-primary">
                              {formatMoney(item.line_total_cents)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-border px-5 py-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-text-muted">{t.cart.subtotal}</span>
                  <span className="font-display text-xl tnum">
                    {formatMoney(cart?.subtotal_cents ?? 0)}
                  </span>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    close();
                    navigate("/checkout");
                  }}
                >
                  {t.cart.checkout}
                </Button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

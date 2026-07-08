import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Skeleton } from "@/components/brand/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";
import { formatMoney } from "@/lib/format";

import { useAdminProducts, useDeleteProduct } from "./adminApi";
import { useIsDemo } from "./demo/demoContext";

export function AdminProducts() {
  const t = useT();
  const { data, isLoading } = useAdminProducts();
  const del = useDeleteProduct();
  const demo = useIsDemo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{t.admin.products.title}</h1>
          <p className="text-text-muted">{t.admin.products.subtitle}</p>
        </div>
        {!demo && (
          <Button asChild>
            <Link to="/admin/products/new">
              <Plus className="h-4 w-4" /> {t.admin.products.newProduct}
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t.admin.products.colProduct}</th>
                <th className="px-4 py-3 font-medium">{t.admin.products.colCategory}</th>
                <th className="px-4 py-3 font-medium">{t.admin.products.colFrom}</th>
                <th className="px-4 py-3 font-medium">{t.admin.products.colStatus}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.map((p) => {
                const from = p.sizes.length
                  ? Math.min(...p.sizes.map((s) => s.price_cents))
                  : p.base_price_cents;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url ?? "/images/lebongout-hero.jpg"}
                          alt=""
                          className="h-10 w-10 rounded-ctl object-cover"
                        />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-text-muted">{p.category}</td>
                    <td className="px-4 py-3 tnum">{formatMoney(from)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={p.is_active ? "success" : "neutral"}>
                        {p.is_active ? t.admin.products.active : t.admin.products.hidden}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {!demo && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/products/${p.id}`} aria-label={t.admin.products.editAria}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <button
                            onClick={() => {
                              if (confirm(t.admin.products.confirmHide.replace("{name}", `"${p.name}"`)))
                                del.mutate(p.id);
                            }}
                            className="rounded-ctl p-2 text-text-subtle hover:text-danger"
                            aria-label={t.admin.products.deleteAria}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

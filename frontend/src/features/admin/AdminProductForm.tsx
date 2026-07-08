import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { useCategories } from "@/features/menu/menuApi";
import { useT } from "@/i18n/useT";
import type { ProductSize, ToppingGroup } from "@/types/api";

import { useAdminProduct, useSaveProduct } from "./adminApi";

interface SizeRow {
  id: string;
  name: string;
  price: string; // pounds, as typed
}

const blankSize = (): SizeRow => ({ id: "", name: "", price: "" });

export function AdminProductForm() {
  const t = useT();
  const { productId } = useParams();
  const isEdit = !!productId;
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const { data: existing } = useAdminProduct(productId);
  const save = useSaveProduct();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sizes, setSizes] = useState<SizeRow[]>([blankSize()]);
  const [toppingGroups, setToppingGroups] = useState<ToppingGroup[]>([]);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description);
      setCategory(existing.category);
      setImageUrl(existing.image_url ?? "");
      setIsActive(existing.is_active);
      setSizes(
        existing.sizes.map((s) => ({
          id: s.id,
          name: s.name,
          price: (s.price_cents / 100).toFixed(2),
        })),
      );
      setToppingGroups(existing.topping_groups); // preserved as-is on save
    }
  }, [existing]);

  useEffect(() => {
    if (!category && categories?.length) setCategory(categories[0].id);
  }, [categories, category]);

  function updateSize(i: number, patch: Partial<SizeRow>) {
    setSizes((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function submit() {
    if (!name.trim()) return toast.error(t.admin.productForm.nameRequired);
    const parsedSizes: ProductSize[] = sizes
      .filter((s) => s.name.trim())
      .map((s) => ({
        id: s.id || s.name.trim().toLowerCase().replace(/\s+/g, "-"),
        name: s.name.trim(),
        price_cents: Math.round(parseFloat(s.price || "0") * 100),
      }));
    if (parsedSizes.length === 0) return toast.error(t.admin.productForm.sizeRequired);

    save.mutate(
      {
        id: productId,
        payload: {
          name: name.trim(),
          description: description.trim(),
          category,
          image_url: imageUrl.trim() || null,
          is_active: isActive,
          base_price_cents: Math.min(...parsedSizes.map((s) => s.price_cents)),
          sizes: parsedSizes,
          topping_groups: toppingGroups,
        },
      },
      { onSuccess: () => navigate("/admin/products") },
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/admin/products")}>
        <ArrowLeft className="h-4 w-4" /> {t.admin.productForm.backToProducts}
      </Button>
      <h1 className="mb-6 font-display text-3xl">
        {isEdit ? t.admin.productForm.editTitle : t.admin.productForm.newTitle}
      </h1>

      <div className="space-y-5 rounded-card border border-border bg-surface p-6">
        <div>
          <Label>{t.admin.productForm.name}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>{t.admin.productForm.description}</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t.admin.productForm.category}</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-ctl border border-border bg-surface-2 px-3 text-sm focus-ring"
            >
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              {t.admin.productForm.visibleOnMenu}
            </label>
          </div>
        </div>
        <div>
          <Label>{t.admin.productForm.imageUrl}</Label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div>
          <Label>{t.admin.productForm.sizesAndPrices}</Label>
          <div className="space-y-2">
            {sizes.map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={t.admin.productForm.sizeNamePlaceholder}
                  value={s.name}
                  onChange={(e) => updateSize(i, { name: e.target.value })}
                />
                <Input
                  className="w-28"
                  placeholder="0.00 DT"
                  inputMode="decimal"
                  value={s.price}
                  onChange={(e) => updateSize(i, { price: e.target.value })}
                />
                <button
                  onClick={() => setSizes((prev) => prev.filter((_, idx) => idx !== i))}
                  className="shrink-0 rounded-ctl px-2 text-text-subtle hover:text-danger"
                  aria-label={t.admin.productForm.removeSizeAria}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setSizes((prev) => [...prev, blankSize()])}
          >
            <Plus className="h-4 w-4" /> {t.admin.productForm.addSize}
          </Button>
        </div>

        {toppingGroups.length > 0 && (
          <p className="text-xs text-text-subtle">
            {t.admin.productForm.toppingNote.replace("{count}", String(toppingGroups.length))}
          </p>
        )}

        <Button loading={save.isPending} onClick={submit}>
          {isEdit ? t.admin.productForm.saveChanges : t.admin.productForm.createProduct}
        </Button>
      </div>
    </div>
  );
}

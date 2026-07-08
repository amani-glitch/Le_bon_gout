import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Skeleton } from "@/components/brand/Skeleton";
import { Button } from "@/components/ui/Button";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { useT } from "@/i18n/useT";
import { formatMoney } from "@/lib/format";

import { CustomizeModal } from "./CustomizeModal";
import { useProduct } from "./menuApi";

export function ProductDetailPage() {
  const t = useT();
  const { productId = "" } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(productId);
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return <p className="text-text-muted">{t.menu.notFound}</p>;
  }

  const fromPrice = product.sizes.length
    ? Math.min(...product.sizes.map((s) => s.price_cents))
    : product.base_price_cents;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> {t.menu.back}
      </Button>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-card border border-border">
          <img
            src={product.image_url ?? "/images/lebongout-hero.jpg"}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
          <div className="absolute right-4 top-4">
            <FavoriteButton product={product} />
          </div>
        </div>
        <div>
          <h1 className="font-display text-4xl">{product.name}</h1>
          <p className="mt-3 text-text-muted">{product.description}</p>
          <p className="mt-6 font-display text-2xl tnum text-primary">
            {product.sizes.length > 1 ? t.menu.from : ""}
            {formatMoney(fromPrice)}
          </p>
          <Button size="lg" className="mt-6" onClick={() => setOpen(true)}>
            {t.menu.customizeAndAdd}
          </Button>
        </div>
      </div>
      {open && <CustomizeModal product={product} open={open} onOpenChange={setOpen} />}
    </div>
  );
}

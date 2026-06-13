import Link from "next/link";

import { formatShopMoney } from "@/lib/shopping/format";
import type { ShopProductSummary } from "@/types/shopping";
import { SHOPPING_CATEGORY_LABELS } from "@/types/shopping";

export function ShopProductCard({ product }: { product: ShopProductSummary }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-border p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {SHOPPING_CATEGORY_LABELS[product.category]}
      </p>
      <h3 className="mt-1 text-lg font-semibold">
        <Link
          href={`/shopping/products/${product.slug}`}
          className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {product.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
        {product.description}
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-base font-semibold">
          {formatShopMoney(product.unitAmountCents, product.currency)}
          {product.gstApplicable ? (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              incl. GST
            </span>
          ) : null}
        </p>
        {product.ndisRelevant ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            NDIS-relevant
          </span>
        ) : null}
      </div>
    </article>
  );
}

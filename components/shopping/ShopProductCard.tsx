import Link from "next/link";

import { formatShopMoney } from "@/lib/shopping/format";
import {
  getStockBadgeClass,
  getStockLabel,
  isProductInStock,
} from "@/lib/shopping/stock";
import type { ShopProductSummary } from "@/types/shopping";
import { SHOPPING_CATEGORY_LABELS } from "@/types/shopping";

import { ProductImage } from "./ProductImage";

export function ShopProductCard({ product }: { product: ShopProductSummary }) {
  const inStock = isProductInStock(product.stockQuantity);

  return (
    <article className="flex h-full flex-col rounded-lg border border-border p-4">
      <Link
        href={`/shopping/products/${product.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ProductImage
          title={product.title}
          imageUrls={product.imageUrls}
          className="mb-3 aspect-[3/2]"
        />
      </Link>
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
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-semibold">
          {formatShopMoney(product.unitAmountCents, product.currency)}
          {product.gstApplicable ? (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              incl. GST
            </span>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${getStockBadgeClass(product.stockQuantity)}`}
          >
            {getStockLabel(product.stockQuantity)}
          </span>
          {product.ndisRelevant ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              NDIS-relevant
            </span>
          ) : null}
        </div>
      </div>
      {!inStock ? (
        <p className="mt-2 text-xs text-muted-foreground">Currently unavailable</p>
      ) : null}
    </article>
  );
}

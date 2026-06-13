import Link from "next/link";
import { notFound } from "next/navigation";

import { ShopProductCard } from "@/components/shopping/ShopProductCard";
import { ShoppingNav } from "@/components/shopping/ShoppingNav";
import { ShoppingSafetyNotice } from "@/components/shopping/ShoppingSafetyNotice";
import { isShoppingEnabled } from "@/lib/config/shopping";
import { listPublishedProducts } from "@/lib/shopping/product-service";
import { SHOPPING_CATEGORY_LABELS } from "@/types/shopping";

export const metadata = {
  title: "MapAble Shopping | Assistive products",
  description:
    "Browse curated disability-related products from MapAble's pilot storefront.",
};

type SearchParams = Promise<{ category?: string; q?: string }>;

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isShoppingEnabled()) notFound();

  const params = await searchParams;
  const category = params.category as keyof typeof SHOPPING_CATEGORY_LABELS | undefined;
  const q = params.q;

  const result = await listPublishedProducts({
    category:
      category && category in SHOPPING_CATEGORY_LABELS ? category : undefined,
    q,
    pageSize: 24,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          MapAble Shopping
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Curated assistive products
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          MapAble-operated pilot storefront for disability-related essentials.
          Safety and suitability notes come before paid placement.
        </p>
        <ShoppingNav />
      </header>

      <section className="mt-8 space-y-4" aria-label="Search and filters">
        <form className="flex flex-wrap gap-3" action="/shopping" method="get">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search products"
            className="min-h-11 min-w-[220px] flex-1 rounded-md border border-input px-3"
          />
          <select
            name="category"
            defaultValue={category ?? ""}
            className="min-h-11 rounded-md border border-input px-3"
            aria-label="Category"
          >
            <option value="">All categories</option>
            {Object.entries(SHOPPING_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Search
          </button>
        </form>
      </section>

      <div className="mt-8">
        <ShoppingSafetyNotice compact />
      </div>

      <section className="mt-8" aria-label="Product catalogue">
        {result.items.length === 0 ? (
          <p>No products match your search.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((product) => (
              <li key={product.id}>
                <ShopProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        Looking for programme information?{" "}
        <Link href="/marketplace" className="underline">
          MapAble Marketplace overview
        </Link>
      </p>
    </div>
  );
}

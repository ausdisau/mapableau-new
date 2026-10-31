import Link from "next/link";

import { MarketplaceProductCard } from "@/components/marketplace/MarketplaceClient";
import {
  getCategoryLabel,
  listMarketplaceProducts,
} from "@/lib/marketplace/catalog";
import {
  MARKETPLACE_CATEGORIES,
  type MarketplaceCategorySlug,
} from "@/lib/marketplace/types";

export const metadata = {
  title: "Browse | MapAble Marketplace",
};

export default async function MarketplaceBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await searchParams;
  const category = MARKETPLACE_CATEGORIES.some((c) => c.slug === rawCategory)
    ? (rawCategory as MarketplaceCategorySlug)
    : undefined;
  const products = listMarketplaceProducts(category);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          {category ? getCategoryLabel(category) : "Browse products"}
        </h1>
        <p className="text-muted-foreground">
          {products.length} product{products.length === 1 ? "" : "s"}
          {category ? " in " + getCategoryLabel(category).toLowerCase() : ""}.
        </p>
      </header>

      <aside className="rounded-xl border border-[#073F97]/20 bg-[#F5F7FC] p-5" aria-labelledby="evidence-demo-heading">
        <h2 id="evidence-demo-heading" className="text-lg font-bold text-[#073F97]">
          Explore an evidence-first Marketplace concept
        </h2>
        <p className="mt-2 text-sm text-[#0C1833]">
          Compare six synthetic equipment examples, see seller statements and unknowns, and download
          a local-only enquiry draft. This preview cannot create purchases, invoices or payments.
        </p>
        <Link href="/marketplace/browse/evidence-preview"
          className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-[#073F97] px-4 py-2 font-semibold text-white hover:bg-[#042A6A] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#073F97]">
          Open evidence-first preview
        </Link>
      </aside>

      <nav className="flex flex-wrap gap-2" aria-label="Product categories">
        <Link
          href="/marketplace/browse"
          aria-current={!category ? "page" : undefined}
          className={"rounded-full border px-3 py-1 text-sm " +
            (!category ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
        >
          All
        </Link>
        {MARKETPLACE_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={"/marketplace/browse?category=" + cat.slug}
            aria-current={category === cat.slug ? "page" : undefined}
            className={"rounded-full border px-3 py-1 text-sm " +
              (category === cat.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {cat.label}
          </Link>
        ))}
      </nav>

      {products.length === 0 ? (
        <p className="text-muted-foreground">No products in this category yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <MarketplaceProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

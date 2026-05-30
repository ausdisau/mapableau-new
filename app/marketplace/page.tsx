import Link from "next/link";

import { MarketplaceProductCard } from "@/components/marketplace/MarketplaceClient";
import { requireAuth } from "@/lib/auth/guards";
import { listMarketplaceProducts } from "@/lib/marketplace/catalog";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/types";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "MapAble Marketplace",
  description: "Browse disability aids, equipment, and daily essentials.",
};

export default async function MarketplaceHubPage() {
  const user = await requireAuth();
  const featured = listMarketplaceProducts().filter((p) => p.inStock).slice(0, 4);
  const recentOrders = await prisma.billingInvoice.findMany({
    where: { userId: user.id, serviceType: "marketplace" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-heading text-3xl font-bold">MapAble Marketplace</h1>
        <p className="max-w-2xl text-muted-foreground">
          Browse mobility aids, daily living equipment, sensory products, and assistive
          technology. Orders flow through the MapAble billing centre with GST and NDIS support
          item metadata where applicable.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/marketplace/browse"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Browse all products
        </Link>
        <Link
          href="/marketplace/cart"
          className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          View cart
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Shop by category</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MARKETPLACE_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/marketplace/browse?category=${category.slug}`}
              className="rounded-xl border p-4 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="font-medium">{category.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Featured products</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <MarketplaceProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Recent orders</h2>
        {recentOrders.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No marketplace orders yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/dashboard/billing/invoices/${order.id}`}
                  className="block rounded-lg border p-3 hover:border-primary/40"
                >
                  Order {order.id.slice(0, 8)} — {order.status} —{" "}
                  {new Intl.NumberFormat("en-AU", {
                    style: "currency",
                    currency: "AUD",
                  }).format(order.totalCents / 100)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

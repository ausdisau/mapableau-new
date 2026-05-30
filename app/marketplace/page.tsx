import Link from "next/link";

import { MarketplaceProductCard } from "@/components/marketplace/MarketplaceClient";
import { CoreHubCard } from "@/components/core/CoreHubCard";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/guards";
import { mapableHubPageStackClass, mapableSectionHeadingClass } from "@/lib/brand/styles";
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
    <div className={mapableHubPageStackClass}>
      <CorePageHeader
        eyebrow="Shop"
        title="MapAble Marketplace"
        description="Browse mobility aids, daily living equipment, sensory products, and assistive technology. Orders flow through the MapAble billing centre with GST and NDIS support item metadata where applicable."
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="default" size="default">
            <Link href="/marketplace/browse">Browse all products</Link>
          </Button>
          <Button asChild variant="outline" size="default">
            <Link href="/marketplace/cart">View cart</Link>
          </Button>
        </div>
      </CorePageHeader>

      <section>
        <h2 className={mapableSectionHeadingClass}>Shop by category</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MARKETPLACE_CATEGORIES.map((category) => (
            <CoreHubCard
              key={category.slug}
              href={`/marketplace/browse?category=${category.slug}`}
              title={category.label}
              description={category.description}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className={mapableSectionHeadingClass}>Featured products</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <MarketplaceProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section>
        <h2 className={mapableSectionHeadingClass}>Recent orders</h2>
        {recentOrders.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No marketplace orders yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/dashboard/billing/invoices/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-medium">Order {order.id.slice(0, 8)}</span>
                  <StatusBadge status={order.status} />
                  <span className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat("en-AU", {
                      style: "currency",
                      currency: "AUD",
                    }).format(order.totalCents / 100)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

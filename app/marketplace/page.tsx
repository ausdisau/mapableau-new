import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMarketplaceListings } from "@/lib/partner-marketplace/marketplace-service";
import { MarketplaceListingGrid } from "@/components/marketplace/MarketplaceListingGrid";

export const metadata = { title: "MapAble Marketplace" };

export default async function MarketplacePage() {
  const { disabled, listings } = await listMarketplaceListings();

  if (disabled) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-heading text-3xl font-bold">MapAble Marketplace</h1>
        <p className="mt-4 text-muted-foreground">
          Disability aids, equipment, and daily essentials are coming soon.
        </p>
        <Button asChild className="mt-8">
          <Link href="/provider-finder">Find providers instead</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="font-heading text-3xl font-bold">MapAble Marketplace</h1>
        <p className="text-muted-foreground">
          Assistive technology, daily living products, and partner listings with
          Stripe checkout and platform take-rate billing.
        </p>
      </div>

      <Card className="mb-8 border-primary/20">
        <CardHeader>
          <CardTitle>Featured listings</CardTitle>
          <CardDescription>
            Providers with an active Marketplace Featured subscription appear first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary">
            <Link href="/provider/billing">List your products — Provider billing</Link>
          </Button>
        </CardContent>
      </Card>

      <MarketplaceListingGrid listings={listings} />
    </main>
  );
}

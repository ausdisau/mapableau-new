import { MarketplaceCartClient } from "@/components/marketplace/MarketplaceClient";
import { MARKETPLACE_CATALOG } from "@/lib/marketplace/catalog";

export const metadata = { title: "Cart | MapAble Marketplace" };

export default function MarketplaceCartPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Your cart</h1>
        <p className="text-muted-foreground">
          Review items and the full payable total. Card payments use Stripe Checkout; amounts
          are calculated on the server. Paying does not imply NDIS eligibility.
        </p>
      </header>
      <MarketplaceCartClient products={MARKETPLACE_CATALOG} />
    </div>
  );
}

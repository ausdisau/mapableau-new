import { MarketplaceCartBadge } from "@/components/marketplace/MarketplaceCartBadge";
import { ModuleNav } from "@/components/layout/ModuleNav";
import { ModuleShell } from "@/components/layout/ModuleShell";
import { requireAuth } from "@/lib/auth/guards";

const NAV_LINKS = [
  { href: "/marketplace/browse", label: "Browse" },
  { href: "/marketplace/cart", label: "Cart", suffix: <MarketplaceCartBadge /> },
  { href: "/dashboard/billing/invoices", label: "My orders" },
];

export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <ModuleShell
      homeHref="/marketplace"
      homeLabel="MapAble Marketplace"
      navAriaLabel="Marketplace navigation"
      backLink={{ href: "/core", label: "MapAble Core" }}
      nav={<ModuleNav links={NAV_LINKS} />}
    >
      {children}
    </ModuleShell>
  );
}

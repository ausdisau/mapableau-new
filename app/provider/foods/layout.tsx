import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

const NAV = [
  { href: "/provider/foods", label: "Dashboard" },
  { href: "/provider/foods/products", label: "Products" },
  { href: "/provider/foods/orders", label: "Orders" },
  { href: "/provider/foods/inventory", label: "Inventory" },
  { href: "/provider/foods/delivery", label: "Delivery" },
  { href: "/provider/foods/payments", label: "Payments" },
];

export default async function ProviderFoodsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("foods:read:org");

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-3 border-b pb-4" aria-label="Provider foods">
        {NAV.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm font-medium hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

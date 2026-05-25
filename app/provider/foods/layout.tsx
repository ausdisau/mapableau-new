import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

export default async function ProviderFoodsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("foods:read:org");
  return <main id="main-content" className="mx-auto max-w-6xl space-y-6 px-4 py-8"><nav className="flex flex-wrap gap-3 text-sm font-semibold" aria-label="Provider Foods"><Link href="/provider/foods">Foods</Link><Link href="/provider/foods/products">Products</Link><Link href="/provider/foods/orders">Orders</Link><Link href="/provider/foods/inventory">Inventory</Link><Link href="/provider/foods/delivery">Delivery</Link><Link href="/provider/foods/payments">Payments</Link></nav>{children}</main>;
}

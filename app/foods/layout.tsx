import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

export default async function FoodsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("foods:read:self");
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white px-4 py-3" aria-label="Foods navigation">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4 text-sm font-semibold">
          <Link href="/foods">Foods</Link>
          <Link href="/foods/search">Search</Link>
          <Link href="/foods/cart">Cart</Link>
          <Link href="/foods/orders">Orders</Link>
          <Link href="/foods/preferences">Preferences</Link>
        </div>
      </nav>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

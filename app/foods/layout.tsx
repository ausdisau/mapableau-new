import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

const NAV = [
  { href: "/foods", label: "Home" },
  { href: "/foods/search", label: "Search" },
  { href: "/foods/cart", label: "Cart" },
  { href: "/foods/orders", label: "Orders" },
  { href: "/foods/preferences", label: "Preferences" },
  { href: "/foods/subscriptions", label: "Subscriptions" },
];

export default async function FoodsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("foods:read:self");

  return (
    <div className="min-h-screen">
      <header className="border-b bg-gradient-to-r from-orange-500/10 to-amber-500/10">
        <nav
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4"
          aria-label="Foods navigation"
        >
          <Link href="/foods" className="font-heading font-bold text-orange-700">
            MapAble Foods
          </Link>
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}

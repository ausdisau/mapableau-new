import Link from "next/link";

export function ShoppingNav() {
  return (
    <nav
      aria-label="Shopping"
      className="flex flex-wrap items-center gap-3 text-sm"
    >
      <Link href="/shopping" className="hover:underline">
        Browse
      </Link>
      <Link href="/shopping/cart" className="hover:underline">
        Cart
      </Link>
      <Link href="/shopping/orders" className="hover:underline">
        Orders
      </Link>
      <Link href="/marketplace" className="text-muted-foreground hover:underline">
        Marketplace programme
      </Link>
    </nav>
  );
}

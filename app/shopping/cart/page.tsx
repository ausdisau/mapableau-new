import { notFound } from "next/navigation";

import { CartClient } from "@/components/shopping/CartClient";
import { ShoppingNav } from "@/components/shopping/ShoppingNav";
import { isShoppingEnabled } from "@/lib/config/shopping";

export const metadata = {
  title: "Cart | MapAble Shopping",
};

export default function ShoppingCartPage() {
  if (!isShoppingEnabled()) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <ShoppingNav />
      <h1 className="mt-6 text-3xl font-semibold">Your cart</h1>
      <div className="mt-8">
        <CartClient />
      </div>
    </div>
  );
}

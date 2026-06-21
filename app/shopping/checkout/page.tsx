import { notFound } from "next/navigation";

import { CheckoutClient } from "@/components/shopping/CheckoutClient";
import { ShoppingNav } from "@/components/shopping/ShoppingNav";
import { isShoppingEnabled } from "@/lib/config/shopping";

export const metadata = {
  title: "Checkout | MapAble Shopping",
};

export default function ShoppingCheckoutPage() {
  if (!isShoppingEnabled()) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <ShoppingNav />
      <h1 className="mt-6 text-3xl font-semibold">Checkout</h1>
      <div className="mt-8">
        <CheckoutClient />
      </div>
    </div>
  );
}

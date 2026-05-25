import Link from "next/link";

import { FoodOrderClient } from "@/components/foods/FoodOrderClient";
import { requireAuth } from "@/lib/auth/guards";
import { listActiveMenu } from "@/lib/foods/food-order-service";

export const metadata = { title: "Order meals | MapAble Foods" };

export default async function FoodsMenuPage() {
  await requireAuth();
  const menu = await listActiveMenu();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/foods" className="text-sm text-primary hover:underline">
        ← Foods
      </Link>
      <h1 className="font-heading text-2xl font-bold">Order meals</h1>
      <p className="text-muted-foreground">
        Review allergens on each item. Confirm your dietary profile before
        submitting.
      </p>
      {menu.length === 0 ? (
        <p role="status">Menu is being prepared. Check back soon.</p>
      ) : (
        <FoodOrderClient menu={menu} />
      )}
    </div>
  );
}

import Link from "next/link";

import { FoodCategoryFilters } from "./FoodCategoryFilters";
import { FoodSearchBar } from "./FoodSearchBar";

export function FoodsHomePage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold">MapAble Foods</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Disability-aware grocery and prepared meal delivery. Set your dietary and accessibility
          preferences before you order.
        </p>
      </header>
      <FoodSearchBar />
      <FoodCategoryFilters />
      <div className="flex flex-wrap gap-3">
        <Link
          href="/foods/cart"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          View cart
        </Link>
        <Link href="/foods/preferences" className="inline-flex min-h-11 items-center rounded-lg border px-4 py-2 text-sm">
          Preferences & allergies
        </Link>
        <Link href="/foods/orders" className="inline-flex min-h-11 items-center rounded-lg border px-4 py-2 text-sm">
          My orders
        </Link>
      </div>
    </div>
  );
}

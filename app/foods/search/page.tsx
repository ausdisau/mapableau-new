import { Suspense } from "react";

import { AccessibilityFoodFilters } from "@/components/foods/AccessibilityFoodFilters";
import { DietaryTagFilters } from "@/components/foods/DietaryTagFilters";
import { FoodCategoryFilters } from "@/components/foods/FoodCategoryFilters";
import { FoodProductCard } from "@/components/foods/FoodProductCard";
import { FoodSearchBar } from "@/components/foods/FoodSearchBar";
import { listPublishedProducts } from "@/lib/foods/catalog-service";

export default async function FoodSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const products = await listPublishedProducts({
    category: sp.category,
    dietaryTag: sp.dietaryTag,
    accessibilityTag: sp.accessibilityTag,
    q: sp.q,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>
      <Suspense>
        <FoodSearchBar defaultQuery={sp.q} />
      </Suspense>
      <FoodCategoryFilters active={sp.category} />
      <DietaryTagFilters active={sp.dietaryTag} />
      <AccessibilityFoodFilters active={sp.accessibilityTag} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <FoodProductCard
            key={p.id}
            id={p.id}
            title={p.title}
            priceAmount={p.priceAmount}
            category={p.category}
            dietaryTags={(p.dietaryTags as string[]) ?? []}
          />
        ))}
      </div>
      {products.length === 0 ? (
        <p role="status" className="text-muted-foreground">
          No products match your filters.
        </p>
      ) : null}
    </div>
  );
}

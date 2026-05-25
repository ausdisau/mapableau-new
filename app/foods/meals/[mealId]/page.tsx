import { notFound } from "next/navigation";

import { FoodProductDetail } from "@/components/foods/FoodProductDetail";
import { requirePermission } from "@/lib/auth/guards";
import { getProduct } from "@/lib/foods/catalog-service";
import { getAllergyProfile } from "@/lib/foods/preferences-service";

export default async function MealProductPage({
  params,
}: {
  params: Promise<{ mealId: string }>;
}) {
  const user = await requirePermission("foods:read:self");
  const { mealId } = await params;
  const product = await getProduct(mealId);
  if (!product) notFound();
  const allergy = await getAllergyProfile(user.id);
  return (
    <FoodProductDetail
      product={product}
      profileAllergens={(allergy?.allergens as string[]) ?? []}
    />
  );
}

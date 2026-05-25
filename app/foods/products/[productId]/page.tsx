import { notFound } from "next/navigation";

import { FoodProductDetail } from "@/components/foods/FoodProductDetail";
import { requirePermission } from "@/lib/auth/guards";
import { getProduct } from "@/lib/foods/catalog-service";
import { getAllergyProfile } from "@/lib/foods/preferences-service";

export default async function FoodProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const user = await requirePermission("foods:read:self");
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) notFound();
  const allergy = await getAllergyProfile(user.id);
  const profileAllergens = (allergy?.allergens as string[]) ?? [];

  return <FoodProductDetail product={product} profileAllergens={profileAllergens} />;
}

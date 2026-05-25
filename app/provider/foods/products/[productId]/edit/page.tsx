import { FoodProductForm } from "@/components/foods/FoodProductForm";

export default async function EditFoodProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <FoodProductForm productId={productId} />;
}

import { AllergyProfileNotice, FoodProductCard } from "@/components/foods/FoodsParticipant";

export default async function FoodProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <div className="space-y-5"><FoodProductCard product={{ id: productId, title: "Food product", priceCents: 2400, description: "Review details, allergens, substitutions, and delivery handover before ordering." }} /><AllergyProfileNotice /></div>;
}
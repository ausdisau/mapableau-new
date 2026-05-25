import { AllergyProfileNotice, FoodProductCard } from "@/components/foods/FoodsParticipant";

export default async function MealPage({ params }: { params: Promise<{ mealId: string }> }) {
  const { mealId } = await params;
  return <div className="space-y-5"><FoodProductCard product={{ id: mealId, title: "Prepared meal", priceCents: 1800, description: "Prepared meal variant with accessibility and allergy review." }} /><AllergyProfileNotice /></div>;
}
import { FoodProductCard, FoodSearchBar } from "@/components/foods/FoodsParticipant";

export default function FoodSearchPage() {
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Search Foods</h1><FoodSearchBar /><FoodProductCard product={{ id: "sample", title: "Sample grocery box", priceCents: 4200, description: "Privacy-safe catalogue preview" }} /></div>;
}

import { FoodInventoryTable, FoodProductForm } from "@/components/foods/FoodsOperations";

export default function ProviderFoodProductsPage() { return <div className="space-y-5"><FoodProductForm /><FoodInventoryTable /></div>; }
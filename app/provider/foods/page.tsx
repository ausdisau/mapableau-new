import { FoodVendorDashboard } from "@/components/foods/FoodVendorDashboard";

export default function ProviderFoodsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Food vendor console</h1>
      <p className="mt-2 text-muted-foreground">Manage products, orders, and deliveries.</p>
      <div className="mt-6">
        <FoodVendorDashboard />
      </div>
    </div>
  );
}

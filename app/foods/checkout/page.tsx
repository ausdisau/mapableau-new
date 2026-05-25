import { FoodCheckoutForm } from "@/components/foods/FoodCheckoutForm";
import { requirePermission } from "@/lib/auth/guards";
import { getAllergyProfile } from "@/lib/foods/preferences-service";

export default async function FoodCheckoutPage() {
  const user = await requirePermission("foods:manage:self");
  const allergy = await getAllergyProfile(user.id);
  return (
    <FoodCheckoutForm profileAllergens={(allergy?.allergens as string[]) ?? []} />
  );
}

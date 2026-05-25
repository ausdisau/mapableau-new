import { FoodPreferencesForm } from "@/components/foods/FoodPreferencesForm";
import { FoodSubstitutionPreferences } from "@/components/foods/FoodSubstitutionPreferences";
import { requirePermission } from "@/lib/auth/guards";
import {
  getParticipantPreferences,
  getSubstitutionPreferences,
} from "@/lib/foods/preferences-service";

export default async function FoodPreferencesPage() {
  const user = await requirePermission("foods:manage:self");
  const [prefs, sub] = await Promise.all([
    getParticipantPreferences(user.id),
    getSubstitutionPreferences(user.id),
  ]);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Food preferences</h1>
      <FoodPreferencesForm
        initialDietary={((prefs?.dietaryPreferences as string[]) ?? []).join(", ")}
        initialDeliveryNotes={prefs?.deliveryNotes ?? ""}
      />
      <FoodSubstitutionPreferences defaultPolicy={sub?.policy ?? "contact_first"} />
      <form
        action="/api/foods/allergy-profile"
        method="post"
        className="max-w-lg space-y-4"
      >
        <h2 className="text-lg font-semibold">Allergy profile</h2>
        <p className="text-sm text-muted-foreground">
          Shared only with your consent for order fulfilment.
        </p>
        <label htmlFor="allergens" className="text-sm font-medium">
          Allergens (comma-separated)
        </label>
        <input
          id="allergens"
          name="allergens"
          className="w-full rounded border p-2"
          defaultValue=""
        />
        <p className="text-xs text-muted-foreground">
          Use the API from the allergy form in account settings, or POST via preferences API.
        </p>
      </form>
    </div>
  );
}

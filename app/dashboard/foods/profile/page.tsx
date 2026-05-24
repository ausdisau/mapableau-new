import Link from "next/link";

import { DietaryProfileForm } from "@/components/foods/DietaryProfileForm";
import { requireAuth } from "@/lib/auth/guards";
import { getDietaryProfile } from "@/lib/foods/dietary-profile-service";

export const metadata = { title: "Dietary profile | MapAble Foods" };

export default async function DietaryProfilePage() {
  const user = await requireAuth();
  const profile = await getDietaryProfile(user.id);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/foods" className="text-sm text-primary hover:underline">
        ← Foods
      </Link>
      <h1 className="font-heading text-2xl font-bold">Dietary profile</h1>
      <p className="text-muted-foreground">
        Allergy and texture information is used before every order.
      </p>
      <DietaryProfileForm
        initial={
          profile
            ? {
                allergies: profile.allergies,
                intolerances: profile.intolerances,
                culturalPreferences: profile.culturalPreferences,
                textureRequirement: profile.textureRequirement,
                swallowingRiskFlag: profile.swallowingRiskFlag,
                notes: profile.notes ?? undefined,
              }
            : undefined
        }
      />
    </div>
  );
}

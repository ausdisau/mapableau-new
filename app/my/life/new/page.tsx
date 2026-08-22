import { redirect } from "next/navigation";

import { LifeIntentForm } from "@/components/personal-agency/LifeIntentForm";
import { personalAgencyFlags } from "@/lib/config/personal-agency";
import { requireLifeIntentGate } from "@/lib/personal-agency/gates";

export const metadata = { title: "Add life intent | My MapAble" };

export default async function NewLifeIntentPage() {
  if (!personalAgencyFlags.lifeIntentsEnabled) redirect("/my");
  await requireLifeIntentGate();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Add something that matters</h1>
        <p className="mt-2 text-muted-foreground">
          Use your own words. MapAble will not replace them with an AI summary.
        </p>
      </header>
      <LifeIntentForm redirectTo="/my/life" />
    </div>
  );
}

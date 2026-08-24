import { redirect } from "next/navigation";

import { AgencyMemoryClient } from "@/components/personal-agency/AgencyMemoryClient";
import { isAgencyMemoryEnabled } from "@/lib/config/agency-memory";
import { personalAgencyFlags } from "@/lib/config/personal-agency";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";

export const metadata = { title: "My Preferences | My MapAble" };

export default async function AgencyMemoryPreferencesPage() {
  if (!personalAgencyFlags.agencyControlEnabled) redirect("/my");
  await requirePersonalAgencyGate();

  if (!isAgencyMemoryEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">My Preferences</h1>
        <p className="max-w-2xl text-muted-foreground">
          Agency Memory is not enabled in this environment. Your other privacy
          controls remain available under Privacy &amp; control.
        </p>
      </div>
    );
  }

  return <AgencyMemoryClient />;
}

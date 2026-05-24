import Link from "next/link";

import { CaseloadTable } from "@/components/support-coordinator/CaseloadTable";
import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";
import { requirePermission } from "@/lib/auth/guards";
import { getCoordinatorCaseload, getCoordinatorProfile } from "@/lib/support-coordination/support-coordination-service";

export default async function SupportCoordinatorHomePage() {
  const user = await requirePermission("coordinator:portal");
  const [profile, caseload] = await Promise.all([
    getCoordinatorProfile(user.id),
    getCoordinatorCaseload(user.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <header>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">
          Support coordination
        </h1>
        <p className="mt-2 text-muted-foreground">
          Consent-first workspace. You only see information participants have authorised.
        </p>
      </header>

      <MapAbleCard title="Your profile">
        <p className="text-sm">
          {profile?.displayName ?? user.name ?? "Support coordinator"}
        </p>
        {profile?.bio ? (
          <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>
        ) : null}
      </MapAbleCard>

      <MapAbleCard title="Caseload dashboard">
        <CaseloadTable rows={caseload} />
      </MapAbleCard>

      <nav aria-label="Coordinator sections" className="flex flex-wrap gap-4">
        <Link href="/support-coordinator/participants" className="min-h-11 text-primary underline">
          All participants
        </Link>
        <Link href="/support-coordinator/referrals" className="min-h-11 text-primary underline">
          Referrals
        </Link>
      </nav>
    </div>
  );
}

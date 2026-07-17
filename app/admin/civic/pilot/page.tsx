import Link from "next/link";

import { PilotSeedPanel } from "@/components/civic-access/PilotSeedPanel";
import { requireAdmin } from "@/lib/auth/guards";
import { isCivicFlagEnabled } from "@/lib/civic-access/feature-flags";

export default async function CivicPilotAdminPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">
          Civic precinct pilot
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Controlled synthetic precinct for Wave 1. Stages after registry:
          static twin, journey simulation, Observatory preview — not enabled
          here.
        </p>
      </header>

      {!isCivicFlagEnabled("assetRegistry") ? (
        <p className="text-sm text-muted-foreground">
          Enable <code>MAPABLE_CIVIC_ENABLED</code> and{" "}
          <code>MAPABLE_CIVIC_ASSET_REGISTRY_ENABLED</code> first.
        </p>
      ) : (
        <PilotSeedPanel />
      )}

      <p className="text-sm">
        <Link className="underline" href="/admin/civic/assets">
          View asset registry
        </Link>
        {" · "}
        <Link className="underline" href="/admin/civic">
          Civic admin home
        </Link>
      </p>
    </div>
  );
}

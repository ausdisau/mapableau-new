import Link from "next/link";

import { PlacementPlannerClient } from "@/components/ads/manager/PlacementPlannerClient";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { listAdvertisersForUser } from "@/lib/ads/auth/advertiser-access";
import { requireAuth } from "@/lib/auth/guards";

export default async function AdsManagerPage() {
  const user = await requireAuth();
  const managerOn = adsFlagsConfig.isManagerEnabled();
  const placementOn = adsFlagsConfig.isPlacementApiEnabled();

  if (!managerOn && !placementOn) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Ads Manager</h1>
        <p role="status" className="text-sm text-muted-foreground">
          Ads Manager is disabled in this environment. Feature flags remain
          off until operational approval.
        </p>
        <Link className="text-sm underline" href="/provider/ads">
          Back to Ads wallet
        </Link>
      </div>
    );
  }

  const advertisers = await listAdvertisersForUser(user);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/provider/ads" className="underline">
            Ads wallet
          </Link>
          {" / "}
          Manager
        </p>
        <h1 className="text-2xl font-bold">MapAble Ads Manager</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Plan MapAble-owned and sandbox DOOH placements with accessible
          budgets, quotes, and mock orders. Sponsored labels never change
          accessibility verification. No live social or DOOH purchasing in
          this build.
        </p>
      </header>

      {advertisers.length === 0 ? (
        <p role="status" className="text-sm">
          No advertiser account is linked to your organisation yet.
        </p>
      ) : (
        <PlacementPlannerClient
          advertisers={advertisers.map((a) => ({
            id: a.id,
            name: a.name,
          }))}
          placementApiEnabled={placementOn}
          discoveryEnabled={adsFlagsConfig.isProviderDiscoveryEnabled()}
          doohSandboxEnabled={adsFlagsConfig.isDoohSandboxEnabled()}
        />
      )}
    </div>
  );
}

import { DispatchConsoleClient } from "@/components/transport-osm/DispatchConsoleClient";
import { requirePermission } from "@/lib/auth/guards";

export default async function ProviderDispatchPage() {
  await requirePermission("operator_dispatch:manage");

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Transport dispatch</h1>
      <p className="text-muted-foreground">
        Your organisation&apos;s active trips on the map. Select a trip to see
        driver and vehicle recommendations.
      </p>
      <DispatchConsoleClient />
    </div>
  );
}

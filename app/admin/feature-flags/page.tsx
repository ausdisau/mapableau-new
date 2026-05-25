import { FeatureFlagEditor } from "@/components/feature-flags/FeatureFlagEditor";
import { listFeatureFlags } from "@/lib/feature-flags/feature-flag-service";

import { FeatureFlagTableWrapper } from "./FeatureFlagTableWrapper";

export const metadata = { title: "Feature flags | Admin" };

export default async function AdminFeatureFlagsPage() {
  const flags = await listFeatureFlags();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Feature flags</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Control staged rollout of resilience modules. Kill switches override all other rules.
        </p>
      </header>
      <FeatureFlagEditor />
      <section aria-labelledby="ff-list-heading">
        <h2 id="ff-list-heading" className="font-heading text-lg font-semibold">
          All flags
        </h2>
        <FeatureFlagTableClient initialFlags={flags} />
      </section>
    </div>
  );
}

function FeatureFlagTableClient({
  initialFlags,
}: {
  initialFlags: Awaited<ReturnType<typeof listFeatureFlags>>;
}) {
  return (
    <FeatureFlagTableWrapper flags={initialFlags.map((f) => ({
      id: f.id,
      key: f.key,
      name: f.name,
      enabled: f.enabled,
      killSwitch: f.killSwitch,
      rolloutPercentage: f.rolloutPercentage,
      moduleArea: f.moduleArea,
    }))} />
  );
}

import { BrandOsPanel } from "@/components/coverage-care/BrandOsPanel";
import { coverageCareConfig } from "@/lib/config/coverage-care";
import { listBrandContent } from "@/lib/coverage-care/brandos-service";
import { resolveCoverageCareProviderAdmin } from "@/lib/coverage-care/demo-actor";

export default async function TenantBrandOsPage() {
  if (!coverageCareConfig.brandOsEnabled) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-[color:var(--cc-olive)]">
          BrandOS preview disabled
        </h1>
        <p className="mt-3">
          Set <code>MAPABLE_COVERAGE_CARE_BRANDOS_ENABLED=true</code> to explore
          messaging, assets, and content approvals.
        </p>
      </div>
    );
  }

  const actor = await resolveCoverageCareProviderAdmin();
  if (!actor) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold">Provider admin required</h1>
      </div>
    );
  }

  const items = listBrandContent();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
        BrandOS management
      </h1>
      <p className="mt-2 text-[color:var(--cc-ink)]/75">
        Draft → approval preview only. Production publish remains blocked.
      </p>
      <BrandOsPanel items={items} />
    </div>
  );
}

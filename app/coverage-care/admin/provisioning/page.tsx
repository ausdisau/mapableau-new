import { CoverageCareDisabledState } from "@/components/coverage-care/DisabledState";
import { ProvisioningPanel } from "@/components/coverage-care/ProvisioningPanel";
import { coverageCareConfig } from "@/lib/config/coverage-care";
import { resolveCoverageCareProviderAdmin } from "@/lib/coverage-care/demo-actor";
import { isCoverageCareSurfaceEnabled } from "@/lib/coverage-care/flag-gate";
import { listProvisioningChecks } from "@/lib/coverage-care/provisioning-service";

export default async function ProvisioningPage() {
  if (!isCoverageCareSurfaceEnabled()) {
    return <CoverageCareDisabledState />;
  }
  if (!coverageCareConfig.provisioningPreviewEnabled) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-[color:var(--cc-olive)]">
          Provisioning preview disabled
        </h1>
        <p className="mt-3">
          Set{" "}
          <code>MAPABLE_COVERAGE_CARE_PROVISIONING_PREVIEW_ENABLED=true</code> to
          run domain-readiness checks. This never changes DNS.
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

  const checks = listProvisioningChecks();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
        Tenant provisioning preview
      </h1>
      <p className="mt-2 text-[color:var(--cc-ink)]/75">
        Readiness checklist for proposed host{" "}
        <code>{coverageCareConfig.host}</code>. No DNS, TLS, or cookie-domain
        writes are performed.
      </p>
      <ProvisioningPanel checks={checks} />
    </div>
  );
}

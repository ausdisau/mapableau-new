import { ProvisioningPanel } from "@/components/coverage-care/ProvisioningPanel";
import { coverageCareConfig } from "@/lib/config/coverage-care";
import { resolveCoverageCareProviderAdmin } from "@/lib/coverage-care/demo-actor";
import { listProvisioningChecks } from "@/lib/coverage-care/provisioning-service";
import { PROPOSED_COVERAGE_CARE_HOST } from "@/lib/tenancy/tenant-host-policy";

export default async function TenantProvisioningPage() {
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
  const host = coverageCareConfig.host || PROPOSED_COVERAGE_CARE_HOST;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
        Tenant provisioning preview
      </h1>
      <p className="mt-2 text-[color:var(--cc-ink)]/75">
        Readiness checklist for proposed host <code>{host}</code>. Status:{" "}
        <strong>NOT CONFIGURED</strong>. No DNS, TLS, or cookie-domain writes.
      </p>
      <aside
        className="mt-6 rounded-md border-2 border-amber-700/40 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        aria-label="NOT CONFIGURED domain card"
      >
        Proposed hostname <code>{host}</code> remains branding context only.
        Reserved hosts never activate. Human DNS/TLS review required.
      </aside>
      <ProvisioningPanel checks={checks} />
    </div>
  );
}

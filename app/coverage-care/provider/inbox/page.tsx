import { CoverageCareDisabledState } from "@/components/coverage-care/DisabledState";
import { ProviderInboxClient } from "@/components/coverage-care/ProviderInboxClient";
import {
  resolveActorTenantId,
  resolveCoverageCareProviderAdmin,
} from "@/lib/coverage-care/demo-actor";
import { listProviderInbox } from "@/lib/coverage-care/enquiry-service";
import { isCoverageCareSurfaceEnabled } from "@/lib/coverage-care/flag-gate";

export default async function ProviderInboxPage() {
  if (!isCoverageCareSurfaceEnabled()) {
    return <CoverageCareDisabledState />;
  }

  const actor = await resolveCoverageCareProviderAdmin();
  if (!actor) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-[color:var(--cc-olive)]">
          Provider access required
        </h1>
        <p className="mt-3 text-[color:var(--cc-ink)]/80">
          Sign in as a provider administrator, or enable the demo actor flag for
          local pilot review.
        </p>
      </div>
    );
  }

  const enquiries = listProviderInbox({
    actor,
    actorTenantId: resolveActorTenantId(),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
        Provider enquiry inbox
      </h1>
      <p className="mt-2 text-[color:var(--cc-ink)]/75">
        Tenant-scoped synthetic enquiries for Coverage Care only.
      </p>
      <ProviderInboxClient enquiries={enquiries} />
    </div>
  );
}

import { TenantProviderInbox } from "@/components/tenants/TenantProviderInbox";
import {
  resolveActorTenantId,
  resolveCoverageCareProviderAdmin,
} from "@/lib/coverage-care/demo-actor";
import { listProviderInbox } from "@/lib/coverage-care/enquiry-service";

export default async function TenantProviderInboxPage() {
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
        Status machine: new → in review → needs information → closed. Withdrawal
        removes visibility immediately.
      </p>
      <TenantProviderInbox enquiries={enquiries} />
    </div>
  );
}

import Link from "next/link";

import { ProviderTripDispatchPanel } from "@/components/transport/ProviderTripDispatchPanel";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderTransportDispatchPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];

  const dispatchPendingCount = organisationId
    ? await prisma.transportTrip.count({
        where: {
          providerOrganisationId: organisationId,
          status: "dispatch_pending",
          dispatchAssignments: { none: { active: true } },
        },
      })
    : 0;

  if (!organisationId) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Transport dispatch</h1>
        <p>You need an organisation membership to manage transport dispatch.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p>
        <Link href="/provider/transport" className="text-sm text-primary hover:underline">
          ← Transport
        </Link>
      </p>
      <header>
        <h1 className="font-heading text-2xl font-bold">Transport dispatch board</h1>
        <p className="text-sm text-muted-foreground">
          Human dispatch only — match suggestions never auto-assign.
          {dispatchPendingCount > 0
            ? ` ${dispatchPendingCount} trip(s) awaiting assignment.`
            : ""}
        </p>
      </header>
      <ProviderTripDispatchPanel organisationId={organisationId} />
    </div>
  );
}

import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { listAllocationProposals } from "@/lib/care-allocation/allocation-service";
import { prisma } from "@/lib/prisma";

export default async function ProviderCareAllocationsPage() {
  const user = await requirePermission("care:manage:org");
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return (
      <p className="text-muted-foreground">
        No provider organisation linked to your account.
      </p>
    );
  }

  const proposals = await listAllocationProposals({
    organisationId,
    status: "review_required",
  });

  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: { name: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Allocation review</h1>
      <p className="text-muted-foreground">
        {org?.name ?? "Provider"} — proposals awaiting human approval (
        {proposals.length})
      </p>
      <p className="text-sm text-muted-foreground">
        Recommendations and any auto-assign paths are subject to eligibility,
        schedule conflict, and compliance safeguards.
      </p>
      <Link href="/provider/care" className="text-primary underline text-sm">
        Back to care hub
      </Link>
      <ul className="space-y-3">
        {proposals.map((p) => (
          <li key={p.id} className="rounded-xl border p-4">
            <p className="font-medium">{p.workerProfile.displayName}</p>
            <p className="text-sm text-muted-foreground">
              Booking{" "}
              <Link
                href={`/provider/care/bookings/${p.allocationRun.careBookingId}`}
                className="text-primary underline"
              >
                {p.allocationRun.careBookingId.slice(0, 8)}…
              </Link>
              — rank {p.rank}, score {(p.combinedScore * 100).toFixed(0)}%,{" "}
              {p.gateResult}
            </p>
          </li>
        ))}
        {proposals.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            No proposals awaiting review.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

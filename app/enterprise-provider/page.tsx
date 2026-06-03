import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getEnterpriseWorkspaceSummaryV2 } from "@/lib/enterprise-provider/workspace-v2-service";

export default async function EnterpriseProviderHomePage() {
  const user = await requirePermission("enterprise:console");
  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
    include: { organisation: true },
  });

  let summary = null;
  if (membership?.organisationId) {
    summary = await getEnterpriseWorkspaceSummaryV2(
      membership.organisationId,
      user
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Enterprise provider console</h1>
      <p className="text-muted-foreground">
        Organisation-scoped operations for your team.
      </p>

      {summary && "openRecoveries" in summary && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Care shifts</p>
            <p className="text-2xl font-semibold">{summary.careShifts ?? 0}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Open recoveries</p>
            <p className="text-2xl font-semibold">{summary.openRecoveries ?? 0}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Recon exceptions</p>
            <p className="text-2xl font-semibold">
              {summary.openReconciliationExceptions ?? 0}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Roster gaps (72h)</p>
            <p className="text-2xl font-semibold">{summary.rosterGaps ?? 0}</p>
          </div>
        </section>
      )}

      {membership ? (
        <nav aria-label="Enterprise sections">
          <ul className="flex flex-col gap-2">
            <li>
              <Link className="text-primary underline" href="/provider/care">
                Care
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" href="/provider/transport">
                Transport
              </Link>
            </li>
            <li>
              <Link className="text-primary underline" href="/provider/support">
                Support
              </Link>
            </li>
          </ul>
        </nav>
      ) : (
        <p>No organisation linked to your account.</p>
      )}
    </div>
  );
}

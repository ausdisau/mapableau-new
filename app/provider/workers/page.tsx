import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export default async function ProviderWorkersPage() {
  const user = await requireAuth();
  const canManage = hasPermission(user.primaryRole, "worker:manage:org");
  const orgIds = await getUserOrganisationIds(user.id);

  const workers = canManage
    ? await prisma.workerProfile.findMany({
        where: { organisationId: { in: orgIds } },
        orderBy: [{ active: "desc" }, { displayName: "asc" }],
      })
    : [];

  return (
    <div className="space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Workers</h1>
          <p className="text-muted-foreground">
            Support workers associated with your organisation.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/provider/workers/new"
            className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Invite worker
          </Link>
        ) : null}
      </div>

      {workers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
          <p className="text-muted-foreground">No workers on your roster yet.</p>
          {canManage ? (
            <Link
              href="/provider/workers/new"
              className="mt-4 inline-block text-primary underline"
            >
              Invite your first worker
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y rounded-xl border border-border/60">
          {workers.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <Link
                  href={`/provider/workers/${w.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {w.displayName}
                </Link>
                {!w.active ? (
                  <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusTextBadge status={w.verificationStatus} />
                <StatusTextBadge status={w.workerScreeningStatus} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

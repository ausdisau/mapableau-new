import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";
import {
  evaluatePbsAccess,
  assertPbsAccess,
  PBS_POSITIONING,
} from "@/lib/positive-behaviour-support";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPbsPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  if (!pbsConfig.enabled) {
    return (
      <div className="rounded-xl border p-6">
        <h1 className="font-heading text-2xl font-bold">Behaviour support plan</h1>
        <p className="mt-2 text-muted-foreground">Module disabled.</p>
      </div>
    );
  }

  const user = await requireAuth();
  const { planId } = await params;
  const plan = await prisma.pbsPlan.findUnique({
    where: { id: planId },
    include: {
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      restrictivePractices: true,
    },
  });
  if (!plan) notFound();

  const decision = evaluatePbsAccess(
    {
      userId: user.id,
      role: user.primaryRole,
      organisationIds: [],
      isPlatformAdmin: false,
    },
    {
      participantUserId: plan.participantUserId,
      organisationId: plan.organisationId,
      assignedPractitionerUserId: plan.practitionerUserId,
      implementingOrganisationId: null,
    },
    { needsClinical: true, action: "plan.read" },
  );
  try {
    assertPbsAccess(decision);
  } catch {
    notFound();
  }

  return (
    <article className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">
        Behaviour support plan
      </h1>
      <p className="text-sm text-muted-foreground">{PBS_POSITIONING}</p>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">Status</dt>
          <dd>{plan.status}</dd>
        </div>
        <div>
          <dt className="font-medium">Type</dt>
          <dd>{plan.planType}</dd>
        </div>
        <div>
          <dt className="font-medium">Version</dt>
          <dd>{plan.currentVersionNumber}</dd>
        </div>
        <div>
          <dt className="font-medium">Review due</dt>
          <dd>{plan.reviewDueAt?.toISOString() ?? "Not set"}</dd>
        </div>
      </dl>
      <p className="text-sm">
        A generated draft is not an active behaviour support plan. Restrictive
        practice status:{" "}
        {plan.restrictivePractices[0]?.authorisationStatus ?? "none recorded"}.
      </p>
    </article>
  );
}

import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";
import { toImplementingProviderView } from "@/lib/positive-behaviour-support";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProviderPbsAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  if (!pbsConfig.enabled) {
    return <p className="p-6">Module disabled.</p>;
  }
  const user = await requireAuth();
  const { assignmentId } = await params;
  const memberships = await prisma.organisationMember.findMany({
    where: { userId: user.id },
    select: { organisationId: true },
  });
  const orgIds = memberships.map((m) => m.organisationId);

  const assignment = await prisma.pbsImplementationAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      plan: {
        select: {
          id: true,
          status: true,
          planType: true,
          reviewDueAt: true,
          practitionerUserId: true,
        },
      },
    },
  });
  if (!assignment || !orgIds.includes(assignment.organisationId)) {
    notFound();
  }

  const view = toImplementingProviderView({
    id: assignment.id,
    planId: assignment.planId,
    status: assignment.status,
    planType: assignment.plan.planType,
    reviewDueAt: assignment.plan.reviewDueAt?.toISOString() ?? null,
    implementationInstructions:
      "Follow practitioner-approved strategies only. Do not invent restrictive practices.",
    monitoringRequirements: "Record monitoring notes via implementation records.",
    restrictivePracticeStatus: "See export checklist — external human process",
    authoringPractitionerDisplay: assignment.plan.practitionerUserId
      ? "Assigned practitioner"
      : "Unassigned",
    consultationStatus: "See plan consultation records",
    aiAssisted: false,
    unresolvedInformation: [],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">
        Implementation assignment
      </h1>
      <p className="text-sm text-muted-foreground">
        Implementing providers receive only necessary implementation fields —
        not full clinical formulations.
      </p>
      <pre className="overflow-auto rounded-lg border bg-muted/40 p-4 text-xs">
        {JSON.stringify(view, null, 2)}
      </pre>
    </div>
  );
}

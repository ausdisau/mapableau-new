import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";
import {
  assertPbsAccess,
  evaluatePbsAccess,
  generatePbsExport,
} from "@/lib/positive-behaviour-support";
import { prisma } from "@/lib/prisma";

const QuerySchema = z.object({
  view: z.enum([
    "practitioner_working",
    "participant_plain_language",
    "easy_read_summary",
    "implementing_worker_instructions",
    "accessible_printable_html",
    "structured_export",
  ]),
});

export async function GET(
  req: Request,
  ctx: { params: Promise<{ planId: string }> },
) {
  if (!pbsConfig.enabled) {
    return jsonError("Positive Behaviour Support is disabled", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { planId } = await ctx.params;
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ view: url.searchParams.get("view") });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const plan = await prisma.pbsPlan.findUnique({
    where: { id: planId },
    include: {
      restrictivePractices: true,
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { sections: true, provenances: true },
      },
    },
  });
  if (!plan) return jsonError("Plan not found", 404);

  const memberships = await prisma.organisationMember.findMany({
    where: { userId: user.id },
    select: { organisationId: true },
  });

  const decision = evaluatePbsAccess(
    {
      userId: user.id,
      role: user.primaryRole,
      organisationIds: memberships.map((m) => m.organisationId),
      isPlatformAdmin: false,
    },
    {
      participantUserId: plan.participantUserId,
      organisationId: plan.organisationId,
      assignedPractitionerUserId: plan.practitionerUserId,
      implementingOrganisationId: null,
    },
    { needsClinical: true, action: "plan.export" },
  );
  try {
    assertPbsAccess(decision);
  } catch {
    return jsonError("Not authorised", 403);
  }

  const version = plan.versions[0];
  const exportResult = generatePbsExport({
    view: parsed.data.view,
    planId: plan.id,
    planType: plan.planType,
    status: plan.status,
    versionNumber: plan.currentVersionNumber,
    authoringPractitionerDisplay: plan.practitionerUserId ?? "Unassigned",
    consultationStatus: plan.consultationEvidencePresent
      ? "evidence_recorded"
      : "missing",
    reviewDate: plan.reviewDueAt?.toISOString() ?? null,
    aiAssisted: version?.sections.some((s) => s.aiAssisted) ?? false,
    unresolvedInformation: [],
    restrictivePracticeStatus:
      plan.restrictivePractices[0]?.authorisationStatus ?? null,
    bodySections:
      version?.sections.map((s) => ({
        title: s.title,
        body: s.bodyText ?? "",
      })) ?? [],
    provenanceCount: version?.provenances.length ?? 0,
    checklistResults: plan.restrictivePractices[0]
      ? [
          {
            item: "rp_gate",
            status: plan.restrictivePractices[0].authorisationStatus,
          },
        ]
      : [],
  });

  if (parsed.data.view === "structured_export") {
    return jsonOk(exportResult.structured);
  }
  return new Response(exportResult.html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

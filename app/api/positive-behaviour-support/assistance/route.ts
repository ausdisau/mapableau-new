import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";
import { PBS_ASSISTANCE_ACTIONS } from "@/lib/positive-behaviour-support";
import { runPbsAssistance } from "@/lib/positive-behaviour-support/services";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  engagementId: z.string().min(1),
  action: z.enum(PBS_ASSISTANCE_ACTIONS),
  unansweredSectionKeys: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  if (!pbsConfig.enabled || !pbsConfig.aiAssistanceEnabled) {
    return jsonError("PBS AI assistance is disabled", 403);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const engagement = await prisma.pbsEngagement.findUnique({
    where: { id: parsed.data.engagementId },
    include: { assignedPractitionerProfile: true },
  });
  if (!engagement) {
    return jsonError("Engagement not found", 404);
  }

  const memberships = await prisma.organisationMember.findMany({
    where: { userId: user.id },
    select: { organisationId: true },
  });

  try {
    const { run, result } = await runPbsAssistance({
      actor: {
        userId: user.id,
        role: user.primaryRole,
        organisationIds: memberships.map((m) => m.organisationId),
        isPlatformAdmin: false,
      },
      engagementId: engagement.id,
      organisationId: engagement.organisationId,
      participantUserId: engagement.participantUserId,
      action: parsed.data.action,
      unansweredSectionKeys: parsed.data.unansweredSectionKeys,
      accessCtx: {
        participantUserId: engagement.participantUserId,
        organisationId: engagement.organisationId,
        assignedPractitionerUserId:
          engagement.assignedPractitionerProfile?.userId ?? null,
        implementingOrganisationId: null,
      },
    });
    return jsonOk({
      runId: run.id,
      authorityCeiling: result.authorityCeiling,
      proposals: result.proposals,
      unknowns: result.unknowns,
      conflicts: result.conflicts,
      inputHash: result.inputHash,
      outputHash: result.outputHash,
      note: "Proposals only — not clinical determinations; not written to final plan",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assistance failed";
    return jsonError(message, 400);
  }
}

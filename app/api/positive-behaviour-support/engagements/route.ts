import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";
import { createPbsEngagement } from "@/lib/positive-behaviour-support/services";
import { prisma } from "@/lib/prisma";

function disabledResponse() {
  return jsonError("Positive Behaviour Support is disabled", 403);
}

const CreateSchema = z.object({
  organisationId: z.string().min(1),
  participantUserId: z.string().min(1),
  providerProfileId: z.string().optional(),
  assignedPractitionerProfileId: z.string().optional(),
});

export async function GET() {
  if (!pbsConfig.enabled) return disabledResponse();
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const engagements = await prisma.pbsEngagement.findMany({
    where: { participantUserId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return jsonOk({ engagements });
}

export async function POST(req: Request) {
  if (!pbsConfig.enabled) return disabledResponse();
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const memberships = await prisma.organisationMember.findMany({
    where: { userId: user.id },
    select: { organisationId: true },
  });
  const orgIds = memberships.map((m) => m.organisationId);

  if (
    parsed.data.participantUserId !== user.id &&
    !orgIds.includes(parsed.data.organisationId)
  ) {
    return jsonError("Not authorised for this participant", 403);
  }

  try {
    const engagement = await createPbsEngagement({
      actor: {
        userId: user.id,
        role: user.primaryRole,
        organisationIds: orgIds,
        isPlatformAdmin: false,
      },
      input: parsed.data,
      actorOrganisationIds:
        parsed.data.participantUserId === user.id
          ? [...new Set([...orgIds, parsed.data.organisationId])]
          : orgIds,
    });
    return jsonOk({ engagement }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    return jsonError(message, 400);
  }
}

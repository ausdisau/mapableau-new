import {
  acceptAiCandidate,
  AiMatchAcceptError,
} from "@/lib/ai-matching/ai-match-service";
import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const user = await requireApiPermission("ai_matching:run");
  if (user instanceof Response) return user;

  const { candidateId } = await params;

  const memberships = await prisma.organisationMember.findMany({
    where: { userId: user.id },
    select: { organisationId: true },
  });
  const actorOrganisationId =
    memberships.length === 1 ? memberships[0].organisationId : null;

  try {
    const candidate = await acceptAiCandidate(candidateId, user.id, {
      actorOrganisationId,
    });
    return jsonOk({ candidate });
  } catch (e) {
    if (e instanceof AiMatchAcceptError) {
      const status =
        e.code === "NOT_FOUND"
          ? 404
          : e.code === "TENANT_MISMATCH"
            ? 403
            : e.code === "FAIRNESS_REVIEW_REQUIRED"
              ? 409
              : 409;
      return jsonError(e.message, status);
    }
    throw e;
  }
}

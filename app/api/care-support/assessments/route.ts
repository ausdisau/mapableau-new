import { ZodError } from "zod";
import { z } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  CareSupportAccessError,
  canUseCoordinatorPortal,
} from "@/lib/care-support/access-control";
import {
  createAssessment,
  listAssessmentsForParticipant,
} from "@/lib/care-support/assessment-service";
import { assertCoordinatorCanAccessParticipant } from "@/lib/care-support/access-control";
import { createAssessmentSchema } from "@/schemas/care-support";

const createBodySchema = createAssessmentSchema.extend({
  participantId: z.string().optional(),
});

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const participantId = url.searchParams.get("participantId") ?? user.id;

  try {
    if (participantId !== user.id) {
      if (!canUseCoordinatorPortal(user)) return jsonError("Forbidden", 403);
      await assertCoordinatorCanAccessParticipant(
        user.id,
        participantId,
        "care_support.assessment_share"
      );
    }
    const assessments = await listAssessmentsForParticipant(participantId);
    return jsonOk({ assessments });
  } catch (e) {
    if (e instanceof CareSupportAccessError) {
      return jsonError(e.message, 403);
    }
    return jsonError("List failed", 500);
  }
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = createBodySchema.parse(await req.json());
    const asCoordinator =
      Boolean(body.participantId && body.participantId !== user.id) &&
      canUseCoordinatorPortal(user);

    if (!asCoordinator && !canUseCoordinatorPortal(user)) {
      const perm = await requireApiPermission("care:manage:self");
      if (perm instanceof Response) return perm;
    } else if (!asCoordinator) {
      const perm = await requireApiPermission("care:manage:self");
      if (perm instanceof Response) return perm;
    }

    const participantId = asCoordinator ? body.participantId! : user.id;

    const assessment = await createAssessment({
      participantId,
      actorUserId: user.id,
      sectionsJson: body.sectionsJson as Record<string, unknown> | undefined,
      source: body.source,
      asCoordinator,
    });
    return jsonOk({ assessment }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof CareSupportAccessError) {
      return jsonError(e.message, 403);
    }
    return jsonError("Create failed", 500);
  }
}

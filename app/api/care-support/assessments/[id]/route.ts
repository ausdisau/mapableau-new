import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  CareSupportAccessError,
  canUseCoordinatorPortal,
} from "@/lib/care-support/access-control";
import {
  getAssessmentById,
  getAssessmentForCoordinatorView,
  reviewAssessment,
  submitAssessment,
  updateAssessment,
} from "@/lib/care-support/assessment-service";
import { updateAssessmentSchema } from "@/schemas/care-support";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await context.params;
  const assessment = await getAssessmentById(id);
  if (!assessment) return jsonError("Not found", 404);

  try {
    if (assessment.participantId === user.id) {
      return jsonOk({ assessment });
    }
    if (canUseCoordinatorPortal(user)) {
      const view = await getAssessmentForCoordinatorView(id, user.id);
      return jsonOk({ assessment: view });
    }
    return jsonError("Forbidden", 403);
  } catch (e) {
    if (e instanceof CareSupportAccessError) return jsonError(e.message, 403);
    return jsonError("Failed", 500);
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await context.params;

  try {
    const body = updateAssessmentSchema.parse(await req.json());
    const existing = await getAssessmentById(id);
    if (!existing) return jsonError("Not found", 404);

    const asCoordinator =
      existing.participantId !== user.id && canUseCoordinatorPortal(user);

    if (body.status === "submitted") {
      const submitted = await submitAssessment(id, user.id);
      return jsonOk({ assessment: submitted });
    }

    if (body.status === "reviewed" && asCoordinator) {
      const reviewed = await reviewAssessment(id, user.id);
      return jsonOk({ assessment: reviewed });
    }

    const updated = await updateAssessment({
      assessmentId: id,
      actorUserId: user.id,
      sectionsJson: body.sectionsJson as Record<string, unknown> | undefined,
      asCoordinator,
    });
    return jsonOk({ assessment: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof CareSupportAccessError) return jsonError(e.message, 403);
    return jsonError("Update failed", 500);
  }
}

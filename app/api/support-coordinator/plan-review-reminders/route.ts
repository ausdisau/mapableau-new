import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { createPlanReviewReminder } from "@/lib/support-coordination/plan-review-reminder-service";
import { planReviewReminderSchema } from "@/lib/validation/support-coordination";

export async function POST(req: Request) {
  const user = await requireApiPermission("coordinator:portal");
  if (user instanceof Response) return user;

  try {
    const body = planReviewReminderSchema.parse(await req.json());
    const reminder = await createPlanReviewReminder({
      coordinatorId: user.id,
      participantId: body.participantId,
      actorRole: user.primaryRole,
      reviewDate: new Date(body.reviewDate),
      title: body.title,
      notes: body.notes,
    });
    return jsonOk({ reminder }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
      return jsonError(accessDeniedMessage("no_consent"), 403);
    }
    return jsonError("Could not create reminder", 400);
  }
}

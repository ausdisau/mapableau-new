import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { recordMatchEvent } from "@/lib/matching/support-worker-matching";
import { matchEventSchema } from "@/lib/validation/support-workers";

export async function POST(req: Request) {
  const user = await requireApiPermission("support_workers:match_events");
  if (user instanceof Response) return user;

  try {
    const body = matchEventSchema.parse(await req.json());
    const event = await recordMatchEvent({
      participantId: user.id,
      actorUserId: user.id,
      eventType: body.eventType,
      workerProfileId: body.workerProfileId,
      matchRunId: body.matchRunId,
      notes: body.notes,
    });
    return jsonOk(event, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not record event", 500);
  }
}

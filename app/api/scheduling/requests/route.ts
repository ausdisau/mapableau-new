import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createSchedulingRequest } from "@/lib/scheduling/scheduling-service";
import { schedulingRequestSchema } from "@/lib/validation/scheduling";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = schedulingRequestSchema.parse(await req.json());
    const result = await createSchedulingRequest({
      request: body,
      participantId: user.id,
      actorUserId: user.id,
    });
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "TRANSPORT_LOCATIONS_REQUIRED") {
        return jsonError("Pickup and drop-off locations are required for transport.", 400);
      }
    }
    return jsonError("Could not create scheduling request", 500);
  }
}

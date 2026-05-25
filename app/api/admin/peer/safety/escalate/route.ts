import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerModeratorApi } from "@/lib/peer/api-helpers";
import { escalateSafety } from "@/lib/peer/peer-safety-service";
import { safetyEscalationSchema } from "@/lib/validation/peer";

export async function POST(req: Request) {
  const user = await requirePeerModeratorApi();
  if (user instanceof Response) return user;
  try {
    const body = safetyEscalationSchema.parse(await req.json());
    const event = await escalateSafety(user.id, body);
    return jsonOk({ safetyEvent: event }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not escalate", 400);
  }
}

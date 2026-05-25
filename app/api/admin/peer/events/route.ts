import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerAdminApi } from "@/lib/peer/api-helpers";
import { adminCreatePeerEvent } from "@/lib/peer/peer-event-service";
import { adminCreatePeerEventSchema } from "@/lib/validation/peer";

export async function POST(req: Request) {
  const user = await requirePeerAdminApi();
  if (user instanceof Response) return user;
  try {
    const body = adminCreatePeerEventSchema.parse(await req.json());
    const event = await adminCreatePeerEvent(user.id, body);
    return jsonOk({ event }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not create event", 400);
  }
}

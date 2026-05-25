import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerAdminApi } from "@/lib/peer/api-helpers";
import { adminCreatePeerCircle } from "@/lib/peer/peer-circle-service";
import { adminCreatePeerCircleSchema } from "@/lib/validation/peer";

export async function POST(req: Request) {
  const user = await requirePeerAdminApi();
  if (user instanceof Response) return user;
  try {
    const body = adminCreatePeerCircleSchema.parse(await req.json());
    const circle = await adminCreatePeerCircle(user.id, body);
    return jsonOk({ circle }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not create circle", 400);
  }
}

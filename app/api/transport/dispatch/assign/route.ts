import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { manualDispatchAssign } from "@/lib/transport-osm/dispatch-assign-service";
import { manualDispatchAssignSchema } from "@/lib/validation/transport-osm";

export async function POST(req: Request) {
  const user = await requireApiPermission("dispatch:manage");
  if (user instanceof Response) return user;

  try {
    const parsed = manualDispatchAssignSchema.parse(await req.json());
    const result = await manualDispatchAssign({
      ...parsed,
      actorUserId: user.id,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message.startsWith("ASSIGNMENT_INVALID")) {
      return jsonError(e.message.replace("ASSIGNMENT_INVALID:", ""), 400);
    }
    return jsonError("Assign failed", 500);
  }
}

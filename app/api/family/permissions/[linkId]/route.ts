import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { updateNomineePermissions } from "@/lib/family/nominee-service";
import { updatePermissionsSchema } from "@/lib/validation/family";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { linkId } = await params;

  try {
    const body = updatePermissionsSchema.parse(await req.json());
    const link = await updateNomineePermissions({
      linkId,
      participantId: user.id,
      scopes: body.scopes,
    });
    return jsonOk({ link });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Access denied", 403);
    }
    return jsonError("Could not update permissions", 400);
  }
}

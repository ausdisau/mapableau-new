import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { createSupportCoordinationNote } from "@/lib/support-coordination/support-coordination-service";
import { createNoteSchema } from "@/lib/validation/support-coordination";

export async function POST(req: Request) {
  const user = await requireApiPermission("coordinator:portal");
  if (user instanceof Response) return user;

  try {
    const body = createNoteSchema.parse(await req.json());
    const note = await createSupportCoordinationNote({
      coordinatorId: user.id,
      participantId: body.participantId,
      actorRole: user.primaryRole,
      content: body.content,
      relationshipId: body.relationshipId,
    });
    return jsonOk({ note }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
      return jsonError(accessDeniedMessage("no_consent"), 403);
    }
    return jsonError("Could not save note", 400);
  }
}

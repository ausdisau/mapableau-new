import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { inviteNominee } from "@/lib/family/family-invitation-service";
import { inviteNomineeSchema } from "@/lib/validation/family";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (user.primaryRole !== "participant" && user.primaryRole !== "mapable_admin") {
    return jsonError("Only participants can invite family supporters", 403);
  }

  try {
    const body = inviteNomineeSchema.parse(await req.json());
    const result = await inviteNominee({
      participantId: user.id,
      nomineeEmail: body.nomineeEmail,
      nomineeName: body.nomineeName,
      relationship: body.relationship,
      scopes: body.scopes,
    });
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not send invitation", 400);
  }
}

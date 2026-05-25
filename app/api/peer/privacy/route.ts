import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerProfileApi } from "@/lib/peer/api-helpers";
import { updatePeerPrivacy } from "@/lib/peer/peer-privacy-service";
import { updatePeerPrivacySchema } from "@/lib/validation/peer";

export async function PATCH(req: Request) {
  const ctx = await requirePeerProfileApi();
  if (ctx instanceof Response) return ctx;

  try {
    const body = updatePeerPrivacySchema.parse(await req.json());
    const settings = await updatePeerPrivacy(
      ctx.user.id,
      ctx.profile.id,
      body
    );
    return jsonOk({ settings });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not update privacy", 400);
  }
}

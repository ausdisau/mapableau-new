import { dclmfProjectionRequestSchema } from "@mapable/contracts";
import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { projectContext } from "@/lib/dc-lmf/projection-service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await req.json();
    const parsed = dclmfProjectionRequestSchema.parse({
      ...body,
      participantId: user.id,
      actorUserId: user.id,
    });

    // Public v1 route is self-only. Cross-user/service projections use internal
    // adapters so existing consent, assignment and organisation checks run first.
    const projection = await projectContext(parsed);
    return jsonOk({ projection });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof Error) return jsonError(error.message, 400);
    return jsonError("Unable to build DC-LMF projection", 500);
  }
}

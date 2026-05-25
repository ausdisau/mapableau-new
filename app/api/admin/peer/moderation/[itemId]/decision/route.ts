import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requirePeerModeratorApi } from "@/lib/peer/api-helpers";
import { applyModerationDecision } from "@/lib/peer/peer-moderation-service";
import { moderationDecisionSchema } from "@/lib/validation/peer";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await requirePeerModeratorApi();
  if (user instanceof Response) return user;
  const { itemId } = await params;
  try {
    const body = moderationDecisionSchema.parse(await req.json());
    const result = await applyModerationDecision(itemId, user.id, body);
    return jsonOk({ queue: result });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not apply decision", 400);
  }
}

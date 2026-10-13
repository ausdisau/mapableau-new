import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  CivicAccessError,
  createCivicIssueDraft,
} from "@/lib/access/civic/draft";
import { civicIssueDraftInputSchema } from "@/lib/access/civic/types";
import { openInfrastructureFlags } from "@/lib/integrations/access/flags";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!openInfrastructureFlags.open311) {
    return jsonError("Open311 civic bridge disabled", 404);
  }
  try {
    const body = await req.json();
    const parsed = civicIssueDraftInputSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const draft = createCivicIssueDraft(parsed.data);
    const { actorRef: _a, confirmationToken, ...publicDraft } = draft;
    return jsonOk({
      draft: publicDraft,
      confirmationRequired: true,
      message:
        "Draft created. Explicit human confirmation required before Open311 submit.",
      confirmationToken,
    }, 201);
  } catch (error) {
    if (error instanceof CivicAccessError) {
      return jsonError(error.message, error.status);
    }
    throw error;
  }
}

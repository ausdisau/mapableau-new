import { z } from "zod";
import { chooseOption, chooseOptionInputSchema, formatOptionsForParticipant, OptionsEngineError } from "@/lib/ai/platform/options-engine";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonBodyErrorResponse, parseJsonRequestBody } from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isOptionsEngineEnabled } from "@/lib/config/options-engine";
export const runtime = "nodejs";
type Params = { params: Promise<{ sessionId: string }> };
const bodySchema = chooseOptionInputSchema.omit({ sessionId: true, participantId: true, tenantId: true }).extend({
  optionId: z.string().min(1).max(120), tenantId: z.string().min(1).max(120).optional(),
  prepareActionProposal: z.boolean().optional(), missionId: z.string().min(1).max(120).optional(),
  consentScopes: z.array(z.string().max(120)).max(30).optional(),
});
export async function POST(req: Request, { params }: Params) {
  if (!isOptionsEngineEnabled()) return jsonError("OPTIONS_ENGINE_DISABLED", 403);
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { sessionId } = await params;
  let body: unknown;
  try { body = await parseJsonRequestBody(req); } catch (e) { const err = jsonBodyErrorResponse(e); return jsonError(err.message, err.status); }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const result = chooseOption({ sessionId, optionId: parsed.data.optionId, participantId: user.id, tenantId: parsed.data.tenantId ?? user.id, prepareActionProposal: parsed.data.prepareActionProposal ?? true, missionId: parsed.data.missionId, consentScopes: parsed.data.consentScopes });
    await createAuditEvent({ actorUserId: user.id, participantId: user.id, action: "options.chosen", entityType: "OptionsSession", entityId: sessionId, metadata: { optionId: result.selected.optionId, didAssign: result.didAssign, didConfirmTransport: result.didConfirmTransport, didDiscloseToEmployer: result.didDiscloseToEmployer, preparedProposalId: result.preparedProposalId } });
    return jsonOk({ result, presentation: formatOptionsForParticipant(result.session) });
  } catch (err) {
    if (err instanceof OptionsEngineError) return jsonError(err.message, err.message.includes("ISOLATION") ? 403 : 400);
    return jsonError("OPTIONS_CHOOSE_FAILED", 400);
  }
}

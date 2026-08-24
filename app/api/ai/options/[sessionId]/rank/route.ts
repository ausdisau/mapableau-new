import { z } from "zod";
import { formatOptionsForParticipant, optionCandidateSchema, OptionsEngineError, rankingPrioritiesSchema, reRankOptions } from "@/lib/ai/platform/options-engine";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonBodyErrorResponse, parseJsonRequestBody } from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isOptionsEngineEnabled } from "@/lib/config/options-engine";
export const runtime = "nodejs";
type Params = { params: Promise<{ sessionId: string }> };
const bodySchema = z.object({ tenantId: z.string().min(1).max(120).optional(), rankingPriorities: rankingPrioritiesSchema, candidates: z.array(optionCandidateSchema).max(200) }).strict();
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
    const session = reRankOptions({ sessionId, participantId: user.id, tenantId: parsed.data.tenantId ?? user.id, rankingPriorities: parsed.data.rankingPriorities, candidates: parsed.data.candidates });
    return jsonOk({ session, presentation: formatOptionsForParticipant(session) });
  } catch (err) {
    if (err instanceof OptionsEngineError) return jsonError(err.message, err.message.includes("ISOLATION") ? 403 : 400);
    return jsonError("OPTIONS_RERANK_FAILED", 400);
  }
}

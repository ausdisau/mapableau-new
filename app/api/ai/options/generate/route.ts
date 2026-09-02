import { z } from "zod";
import { formatOptionsForParticipant, generateOptions, optionsRequestSchema, OptionsEngineError } from "@/lib/ai/platform/options-engine";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonBodyErrorResponse, parseJsonRequestBody } from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isOptionsEngineEnabled } from "@/lib/config/options-engine";

export const runtime = "nodejs";
const bodySchema = optionsRequestSchema.extend({ tenantId: z.string().min(1).max(120).optional() });

export async function POST(req: Request) {
  if (!isOptionsEngineEnabled()) return jsonError("OPTIONS_ENGINE_DISABLED", 403);
  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-options-generate:${ip}`, { windowMs: 60_000, max: 20 })) return jsonError("RATE_LIMITED", 429);
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  let body: unknown;
  try { body = await parseJsonRequestBody(req); } catch (e) { const err = jsonBodyErrorResponse(e); return jsonError(err.message, err.status); }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const session = generateOptions({ ...parsed.data, tenantId: parsed.data.tenantId ?? user.id, participantId: user.id, actorId: user.id });
    await createAuditEvent({ actorUserId: user.id, participantId: user.id, action: "options.generated", entityType: "OptionsSession", entityId: session.sessionId, metadata: { domain: session.domain, optionCount: session.options.length, eliminated: session.eliminated.length, traceId: session.traceId } });
    return jsonOk({ session, presentation: formatOptionsForParticipant(session) });
  } catch (err) {
    if (err instanceof OptionsEngineError) return jsonError(err.message, 400);
    return jsonError(err instanceof Error ? err.message : "OPTIONS_GENERATE_FAILED", 400);
  }
}

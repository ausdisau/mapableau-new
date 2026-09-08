import {
  DISABILITY_AGENT_OPERATIONS,
  disabilityAgentJsonError,
  disabilityAgentJsonOk,
} from "@/lib/api/disability-agent-api-contract";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  assessMentalHealthSafety,
  buildMentalHealthSafetyResponse,
  type MentalHealthConversationMessage,
} from "@/lib/ask-mapable";

const OPERATION = DISABILITY_AGENT_OPERATIONS.mapableAskQuery;
const MAX_QUERY_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

function parseMessages(raw: unknown): MentalHealthConversationMessage[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: MentalHealthConversationMessage[] = [];

  for (const item of raw.slice(-8)) {
    if (!item || typeof item !== "object") continue;
    const message = item as Record<string, unknown>;
    if (message.role !== "user" && message.role !== "assistant") continue;
    if (typeof message.content !== "string") continue;
    const content = message.content.trim();
    if (!content) continue;
    out.push({ role: message.role, content });
  }

  return out.length ? out : undefined;
}

/**
 * Deterministic, no-model crisis preflight for MapAble Companion.
 *
 * This endpoint intentionally does not require authentication and does not
 * persist the query. A person should still be able to reach crisis pathways if
 * their MapAble session has expired. It does not diagnose, predict suicide or
 * perform clinical risk stratification.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(ip, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })) {
    return disabilityAgentJsonError(OPERATION, 429, {
      error: "Too many requests. Please wait a moment.",
      code: "RATE_LIMITED",
      retryable: true,
    });
  }

  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";

    if (!query) {
      return disabilityAgentJsonError(OPERATION, 400, {
        error: "Please enter a message.",
        code: "VALIDATION_ERROR",
        retryable: false,
      });
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return disabilityAgentJsonError(OPERATION, 400, {
        error: "Your message is too long. Please shorten it and try again.",
        code: "VALIDATION_ERROR",
        retryable: false,
      });
    }

    const messages = parseMessages(body.messages);
    const assessment = assessMentalHealthSafety(query, messages);
    const response = buildMentalHealthSafetyResponse(assessment);

    return disabilityAgentJsonOk(OPERATION, {
      intercepted: Boolean(response),
      state: assessment.state,
      response,
      operationId: OPERATION,
    });
  } catch {
    // Fail open to the existing Ask MapAble guardrail stack rather than block
    // the person's conversation because this extra preflight is unavailable.
    return disabilityAgentJsonOk(OPERATION, {
      intercepted: false,
      state: "unknown",
      response: null,
      operationId: OPERATION,
    });
  }
}

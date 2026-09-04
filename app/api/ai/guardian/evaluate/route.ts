import { z } from "zod";

import {
  evaluateGuardian,
  type GuardianDecision,
} from "@/lib/ai/platform/guardian";
import { DATA_CLASSES } from "@/lib/ai/platform/types/classification";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isGuardianOperational } from "@/lib/config/guardian";

export const runtime = "nodejs";

const dataClassSchema = z.enum(
  DATA_CLASSES as unknown as [string, ...string[]]
);

const FORBIDDEN_BODY_KEYS = [
  "useCloudModel",
  "password",
  "apiKey",
  "privateKey",
  "token",
  "secret",
  "authorization",
] as const;

/**
 * Client may declare purpose and data class hints only.
 * Actor / tenant / authority / consent are resolved server-side.
 * Secrets and cloud-bypass flags are rejected.
 */
const evaluateBodySchema = z
  .object({
    purpose: z.string().min(1).max(200),
    participantId: z.string().min(1).max(128).optional(),
    capabilityKey: z.string().min(1).max(200).optional(),
    dataRefs: z.array(z.string().max(200)).max(50).optional(),
    dataClasses: z.array(dataClassSchema).min(1).max(20),
    structuredPayload: z.record(z.unknown()).optional(),
    requestedOperation: z.string().max(200).optional(),
    objectiveText: z.string().max(4000).optional(),
    consentScopesPresent: z.array(z.string().max(100)).max(30).optional(),
    minimumNecessaryFields: z.array(z.string().max(100)).max(50).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    for (const key of FORBIDDEN_BODY_KEYS) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Forbidden field: ${key}`,
          path: [key],
        });
      }
    }
  });

function publicDecision(decision: GuardianDecision) {
  return {
    decision: decision.decision,
    reasonCodes: decision.reasonCodes,
    policyVersion: decision.policyVersion,
    sensitivity: decision.sensitivity,
    processingZone: decision.processingZone,
    modelSignals: decision.modelSignals.map((s) => ({
      signalId: s.signalId,
      signalType: s.signalType,
      provenance: s.provenance,
      capabilityKey: s.capabilityKey,
      generatedAt: s.generatedAt,
      limitations: s.limitations,
    })),
    humanReviewRequired: decision.humanReviewRequired,
    participantConfirmationRequired: decision.participantConfirmationRequired,
    requiresHumanReportabilityAssessment:
      decision.requiresHumanReportabilityAssessment ?? false,
    explanation: {
      title: decision.explanation.title,
      plainLanguage: decision.explanation.plainLanguage,
      nextSteps: decision.explanation.nextSteps,
      humanSupportAvailable: decision.explanation.humanSupportAvailable,
      nonAiPathAvailable: decision.explanation.nonAiPathAvailable,
    },
  };
}

/**
 * POST /api/ai/guardian/evaluate
 * Flag-gated. Fail closed when MAPABLE_GUARDIAN_ENABLED is not true.
 */
export async function POST(req: Request) {
  if (!isGuardianOperational()) {
    return jsonError("GUARDIAN_DISABLED", 403);
  }

  const ip = getClientIp(req);
  if (
    !checkIpRateLimit(`ai-guardian-evaluate:${ip}`, {
      windowMs: 60_000,
      max: 30,
    })
  ) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = evaluateBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  // Server-side resolution — do not trust client authority
  const actorId = user.id;
  const participantId = parsed.data.participantId;
  const selfScope = !participantId || participantId === actorId;

  const result = await evaluateGuardian({
    purpose: parsed.data.purpose,
    participantId,
    actorId,
    tenantId: undefined,
    actorTenantId: undefined,
    capabilityKey: parsed.data.capabilityKey,
    dataRefs: parsed.data.dataRefs,
    dataClasses: parsed.data.dataClasses as never,
    structuredPayload: parsed.data.structuredPayload,
    requestedOperation: parsed.data.requestedOperation,
    objectiveText: parsed.data.objectiveText,
    consentScopesPresent: parsed.data.consentScopesPresent,
    minimumNecessaryFields: parsed.data.minimumNecessaryFields,
    // Self requests may be treated as provisional authority; cross-participant
    // requires explicit grant (fail closed when not self).
    authorityGranted: selfScope,
    requestId: `guardian-${Date.now()}`,
    traceId: `guardian-trace-${actorId.slice(0, 8)}`,
    writeAudit: true,
    privateInferenceAvailable: false,
    deviceEdgeAvailable: false,
  });

  return jsonOk({
    decision: publicDecision(result.decision).decision,
    reasonCodes: result.decision.reasonCodes,
    policyVersion: result.decision.policyVersion,
    sensitivity: result.decision.sensitivity,
    processingZone: result.decision.processingZone,
    modelSignals: publicDecision(result.decision).modelSignals,
    humanReviewRequired: result.decision.humanReviewRequired,
    participantConfirmationRequired:
      result.decision.participantConfirmationRequired,
    continuation: result.continuation,
    auditRef: result.auditRef,
    explanation: publicDecision(result.decision).explanation,
  });
}

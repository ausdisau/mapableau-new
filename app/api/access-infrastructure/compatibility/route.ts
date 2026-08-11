import type { NextRequest } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { ACCESS_ENTITY_TYPES, accessInfrastructureFlags } from "@/lib/access/infrastructure";
import { evaluatePassportCompatibility } from "@/lib/access/infrastructure/compatibility-service";
import type { AccessAdjustment, AccessCapability } from "@/lib/access/infrastructure/types";

export const dynamic = "force-dynamic";

/**
 * POST compatibility evaluation.
 * Does not leak undisclosed requirement values beyond ontology concept ids + explanations.
 */
export async function POST(req: NextRequest) {
  if (
    !accessInfrastructureFlags.enabled ||
    !accessInfrastructureFlags.compatibilityEngine
  ) {
    return jsonError("Compatibility engine is disabled", 404);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const entityType = body?.target?.type ?? body?.entityType;
  const entityId = body?.target?.id ?? body?.entityId;
  if (!entityType || !entityId) {
    return jsonError("target.type and target.id are required", 400);
  }
  if (!ACCESS_ENTITY_TYPES.includes(entityType)) {
    return jsonError("Invalid entity type", 400);
  }

  const capabilities = (body.capabilities ?? []) as AccessCapability[];
  const adjustments = (body.adjustments ?? []) as AccessAdjustment[];
  const contextTags: string[] = [];
  if (body?.context?.vertical) contextTags.push(String(body.context.vertical));
  if (body?.context?.activity) contextTags.push(String(body.context.activity));

  const result = await evaluatePassportCompatibility({
    userId: user.id,
    entityType,
    entityId,
    capabilities,
    adjustments,
    contextTags,
    persist: Boolean(body.persist),
  });

  return jsonOk({
    productionClaim: "none",
    decisionOwner: result.decisionOwner,
    status: result.state.toUpperCase(),
    summary: result.summary,
    participantSummary: result.participantSummary,
    assessmentId: result.assessmentId ?? null,
    findings: result.findings.map((f) => ({
      ontologyConceptId: f.ontologyConceptId,
      criticality: f.criticality,
      result: f.result,
      reasonCode: f.reasonCode,
      explanation: f.explanation,
      requiresConfirmation: f.requiresConfirmation,
      // Do not echo raw requirement values.
    })),
    limitations: result.limitations,
  });
}

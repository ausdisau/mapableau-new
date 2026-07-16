import { getApiUser, apiUnauthorized, apiForbidden } from "@/lib/auth/guards";
import { evaluateShadowRules } from "@/lib/accessibility-ops/shadow/evaluate";
import { emitAccessibilityOpsAudit } from "@/lib/accessibility-ops/audit/emit";
import { hasAccessibilityOpsCapability } from "@/lib/accessibility-ops/permissions";
import { mapOpsError, requireOpsFlag } from "@/lib/accessibility-ops/http";
import type { ShadowEvaluationInput } from "@/lib/accessibility-ops/types";

export async function POST(request: Request) {
  const disabled = requireOpsFlag("ruleRegistry");
  if (disabled) return disabled;

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!hasAccessibilityOpsCapability(user, "shadow:evaluate")) {
    return apiForbidden();
  }

  try {
    const body = (await request.json()) as ShadowEvaluationInput;
    const result = evaluateShadowRules(body);
    await emitAccessibilityOpsAudit({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      action: "accessibility_ops.shadow.evaluated",
      entityType: "AccessibilityShadowEvaluation",
      entityId: result.evaluationId,
      correlationId: result.correlationId,
      metadata: {
        assetId: result.assetId,
        resultCount: result.results.length,
        blocking: result.blocking,
        commercialPlanIgnored: true,
      },
    });
    return Response.json({ evaluation: result });
  } catch (error) {
    return mapOpsError(error);
  }
}

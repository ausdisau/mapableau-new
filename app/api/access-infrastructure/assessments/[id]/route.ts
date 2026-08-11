import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessInfrastructureFlags } from "@/lib/access/infrastructure";
import { getAssessmentForOwner } from "@/lib/access/infrastructure/compatibility-service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (
    !accessInfrastructureFlags.enabled ||
    !accessInfrastructureFlags.compatibilityEngine
  ) {
    return jsonError("Compatibility engine is disabled", 404);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await context.params;
  const assessment = await getAssessmentForOwner(user.id, id);
  if (!assessment) return jsonError("Assessment not found", 404);

  return jsonOk({
    productionClaim: "none",
    assessment: {
      id: assessment.id,
      state: assessment.state,
      entityType: assessment.entityType,
      entityId: assessment.entityId,
      summary: {
        matched: assessment.requiredMetConceptIds.length,
        unknown: assessment.requiredUncertainConceptIds.length,
        mismatched: assessment.requiredUnmetConceptIds.length,
        adjustments: assessment.adjustmentIds.length,
      },
      findings: assessment.findings.map((f) => ({
        ontologyConceptId: f.ontologyConceptId,
        result: f.result,
        reasonCode: f.reasonCode,
        explanation: f.explanation,
        requiresConfirmation: f.requiresConfirmation,
      })),
      limitations: assessment.limitations,
      participantDecisionRequired: assessment.participantDecisionRequired,
      evaluatedAt: assessment.evaluatedAt.toISOString(),
    },
  });
}

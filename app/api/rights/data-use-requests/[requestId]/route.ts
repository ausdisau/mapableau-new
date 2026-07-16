import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isRightsOsEnabled } from "@/lib/rights-os/config";
import { explainPolicyDecision } from "@/lib/rights-os/explain";
import { prisma } from "@/lib/prisma";
import type { RightsPolicyDecisionResult } from "@/lib/rights-os/types";

type RouteParams = { params: Promise<{ requestId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  if (!isRightsOsEnabled()) {
    return jsonError("RightsOS is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { requestId } = await params;
  const record = await prisma.rightsDataUseRequest.findFirst({
    where: {
      OR: [{ id: requestId }, { requestId }],
    },
    include: {
      decisions: { orderBy: { evaluatedAt: "desc" } },
    },
  });

  if (!record) {
    return jsonError("Not found", 404);
  }

  if (record.subjectUserId !== user.id && user.primaryRole !== "mapable_admin") {
    return jsonError("Forbidden", 403);
  }

  const latest = record.decisions[0];
  const explanation = latest
    ? explainPolicyDecision({
        decisionId: latest.decisionId,
        requestId: record.requestId,
        outcome: latest.outcome,
        allowedFields: latest.allowedFields,
        deniedFields: latest.deniedFields,
        allowedOperations: latest.allowedOperations,
        deniedOperations: latest.deniedOperations,
        duties: latest.dutiesJson as RightsPolicyDecisionResult["duties"],
        prohibitions: latest.prohibitionsJson as RightsPolicyDecisionResult["prohibitions"],
        requiredApprovals: latest.requiredApprovals,
        requiredAuthorityRecords: latest.requiredAuthorityRecords,
        reasons: latest.reasonsJson as RightsPolicyDecisionResult["reasons"],
        policyVersion: latest.policyVersion,
        evaluatedAt: latest.evaluatedAt.toISOString(),
        expiresAt: latest.expiresAt?.toISOString(),
      })
    : null;

  return jsonOk({ request: record, explanation });
}

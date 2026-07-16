import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isRightsOsEnabled } from "@/lib/rights-os/config";
import { explainPolicyDecision } from "@/lib/rights-os/explain";
import { evaluatePolicy } from "@/lib/rights-os/policy-evaluator";
import {
  logShadowEvaluation,
  persistPolicyDecision,
} from "@/lib/rights-os/shadow-logger";
import { prisma } from "@/lib/prisma";
import type { RightsDataUseRequestInput } from "@/lib/rights-os/types";

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
      subjectUserId: user.id,
    },
    include: {
      decisions: { orderBy: { evaluatedAt: "desc" } },
    },
  });

  if (!record) {
    return jsonError("Not found", 404);
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
        duties: latest.dutiesJson as never,
        prohibitions: latest.prohibitionsJson as never,
        requiredApprovals: latest.requiredApprovals,
        requiredAuthorityRecords: latest.requiredAuthorityRecords,
        reasons: latest.reasonsJson as never,
        policyVersion: latest.policyVersion,
        evaluatedAt: latest.evaluatedAt.toISOString(),
        expiresAt: latest.expiresAt?.toISOString(),
      })
    : null;

  return jsonOk({ request: record, explanation });
}

export async function POST(_req: Request, { params }: RouteParams) {
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
  });

  if (!record) {
    return jsonError("Not found", 404);
  }

  if (record.subjectUserId !== user.id && user.primaryRole !== "mapable_admin") {
    return jsonError("Forbidden", 403);
  }

  const input: RightsDataUseRequestInput = {
    requestId: record.requestId,
    requester: {
      actorId: record.requesterActorId,
      actorType: record.requesterActorType,
      organisationId: record.requesterOrganisationId ?? undefined,
      role: record.requesterRole ?? undefined,
    },
    recipient: {
      actorId: record.recipientActorId ?? undefined,
      organisationId: record.recipientOrganisationId ?? undefined,
      serviceId: record.recipientServiceId ?? undefined,
      displayName: record.recipientDisplayName,
    },
    subjectUserId: record.subjectUserId,
    purposeCode: record.purposeCode,
    requestedOperations: record.requestedOperations,
    requestedFields: record.requestedFields,
    sourceAssets: record.sourceAssets,
    context: record.contextJson as RightsDataUseRequestInput["context"],
    requestedAt: record.requestedAt.toISOString(),
    requestedUntil: record.requestedUntil?.toISOString(),
    onwardSharingRequested: record.onwardSharingRequested,
    retentionRequested: record.retentionRequested ?? undefined,
  };

  const decision = evaluatePolicy(input);
  await persistPolicyDecision(record.id, record.subjectUserId, decision);
  await logShadowEvaluation({
    actorUserId: user.id,
    subjectUserId: record.subjectUserId,
    requestId: record.requestId,
    decision,
    organisationId: record.recipientOrganisationId ?? undefined,
  });

  await prisma.rightsDataUseRequest.update({
    where: { id: record.id },
    data: { status: "evaluated" },
  });

  return jsonOk({
    decision,
    explanation: explainPolicyDecision(decision),
    mode: "shadow",
  });
}

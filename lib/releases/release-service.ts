import { prisma } from "@/lib/prisma";
import type { ReleaseRing } from "@prisma/client";

import {
  hasAllRequiredApprovals,
  missingApprovals,
  requiredApprovalsFor,
  type ApprovalRecord,
} from "./approvals";
import { isPromotable } from "./rings";

export async function createRelease(input: {
  releaseKey: string;
  title: string;
  summary?: string;
  targetRing?: ReleaseRing;
  requestedById: string;
}) {
  return prisma.productionRelease.create({
    data: {
      releaseKey: input.releaseKey,
      title: input.title,
      summary: input.summary ?? null,
      targetRing: input.targetRing ?? "ring_0_internal",
      status: "draft",
      requestedById: input.requestedById,
      approvals: [],
    },
  });
}

function toApprovalArray(raw: unknown): ApprovalRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is ApprovalRecord =>
      Boolean(r) &&
      typeof r === "object" &&
      "kind" in (r as Record<string, unknown>) &&
      "userId" in (r as Record<string, unknown>)
  );
}

export async function addReleaseApproval(input: {
  releaseId: string;
  approval: ApprovalRecord;
}) {
  const rel = await prisma.productionRelease.findUnique({
    where: { id: input.releaseId },
  });
  if (!rel) throw new Error("RELEASE_NOT_FOUND");
  const approvals = toApprovalArray(rel.approvals);
  if (
    approvals.some(
      (a) =>
        a.kind === input.approval.kind && a.userId === input.approval.userId
    )
  ) {
    return rel;
  }
  approvals.push(input.approval);
  return prisma.productionRelease.update({
    where: { id: input.releaseId },
    data: { approvals: approvals as never },
  });
}

/**
 * Advance a release to the requested ring. Requires that:
 *  - the ring is exactly one step above the current targetRing
 *  - all required approvals are recorded
 *  - if the target is ring_4_general, an executive user must also be set
 *
 * Env vars / feature flags MUST NOT bypass these checks.
 */
export async function promoteRelease(input: {
  releaseId: string;
  toRing: ReleaseRing;
  actorUserId: string;
}) {
  const rel = await prisma.productionRelease.findUnique({
    where: { id: input.releaseId },
  });
  if (!rel) throw new Error("RELEASE_NOT_FOUND");
  if (!isPromotable(rel.targetRing, input.toRing)) {
    throw new Error(
      `RELEASE_PROMOTE_INVALID:${rel.targetRing}->${input.toRing}`
    );
  }
  const approvals = toApprovalArray(rel.approvals);
  if (!hasAllRequiredApprovals(input.toRing, approvals)) {
    throw new Error(
      `RELEASE_MISSING_APPROVALS:${missingApprovals(input.toRing, approvals).join(",")}`
    );
  }
  if (input.toRing === "ring_4_general" && !rel.executiveApprovedById) {
    throw new Error("RELEASE_GA_REQUIRES_EXECUTIVE");
  }
  return prisma.productionRelease.update({
    where: { id: input.releaseId },
    data: {
      targetRing: input.toRing,
      status: input.toRing === "ring_4_general" ? "in_progress" : "in_progress",
    },
  });
}

export function requiredApprovalsForRing(ring: ReleaseRing) {
  return requiredApprovalsFor(ring);
}

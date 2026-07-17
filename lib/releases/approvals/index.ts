import type { ReleaseRing } from "@prisma/client";

export type ApprovalKind = "engineering" | "safety" | "privacy" | "security" | "executive";

export interface ApprovalRecord {
  kind: ApprovalKind;
  userId: string;
  approvedAt: string;
  note?: string;
}

const REQUIRED_APPROVALS_BY_RING: Record<ReleaseRing, ApprovalKind[]> = {
  ring_0_internal: ["engineering"],
  ring_1_canary: ["engineering", "safety"],
  ring_2_pilot: ["engineering", "safety", "privacy"],
  ring_3_general_limited: ["engineering", "safety", "privacy", "security"],
  ring_4_general: ["engineering", "safety", "privacy", "security", "executive"],
};

export function requiredApprovalsFor(ring: ReleaseRing): ApprovalKind[] {
  return REQUIRED_APPROVALS_BY_RING[ring];
}

export function hasAllRequiredApprovals(
  ring: ReleaseRing,
  approvals: ApprovalRecord[]
): boolean {
  const required = new Set(requiredApprovalsFor(ring));
  const have = new Set(approvals.map((a) => a.kind));
  for (const kind of required) {
    if (!have.has(kind)) return false;
  }
  return true;
}

export function missingApprovals(
  ring: ReleaseRing,
  approvals: ApprovalRecord[]
): ApprovalKind[] {
  const have = new Set(approvals.map((a) => a.kind));
  return requiredApprovalsFor(ring).filter((k) => !have.has(k));
}

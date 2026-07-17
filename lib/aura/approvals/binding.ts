import { createHash } from "node:crypto";

/**
 * Approval binding rules. An approval binds a specific `inputHash`. If any
 * bound input changes before execution reaches the approved step, the approval
 * is invalidated automatically and a fresh approval must be gathered.
 *
 * Two-person high-risk approvals require distinct approvers.
 */

export interface ApprovalDecisionRecord {
  id: string;
  decidedByUserId: string;
  decision: "approved" | "rejected" | "pending" | "expired" | "invalidated";
  createdAt: Date;
}

export interface ApprovalRequestSnapshot {
  id: string;
  kind:
    | "participant_step_confirm"
    | "provider_review"
    | "two_person_high_risk"
    | "safety_officer_override";
  requiredApprovers: number;
  inputHash: string;
  status: "pending" | "approved" | "rejected" | "expired" | "invalidated";
  expiresAt: Date | null;
  decisions: ApprovalDecisionRecord[];
}

export function hashApprovalInputs(inputs: Record<string, unknown>): string {
  const canonical = JSON.stringify(sortKeys(inputs));
  return createHash("sha256").update(canonical).digest("hex");
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

export interface EvaluateApprovalInput {
  snapshot: ApprovalRequestSnapshot;
  currentInputHash: string;
  now: Date;
}

export type ApprovalVerdict =
  | { status: "approved" }
  | { status: "pending"; awaiting: number }
  | { status: "rejected"; reason: string }
  | { status: "expired" }
  | { status: "invalidated"; reason: string };

export function evaluateApproval(input: EvaluateApprovalInput): ApprovalVerdict {
  const { snapshot, currentInputHash, now } = input;
  if (snapshot.status === "invalidated") {
    return { status: "invalidated", reason: "explicitly invalidated" };
  }
  if (snapshot.status === "rejected") {
    return { status: "rejected", reason: "already rejected" };
  }
  if (snapshot.expiresAt && snapshot.expiresAt.getTime() < now.getTime()) {
    return { status: "expired" };
  }
  if (snapshot.inputHash !== currentInputHash) {
    return {
      status: "invalidated",
      reason: "input_hash_changed_since_approval",
    };
  }
  const approvals = snapshot.decisions.filter((d) => d.decision === "approved");
  const rejections = snapshot.decisions.filter((d) => d.decision === "rejected");
  if (rejections.length > 0) {
    return { status: "rejected", reason: "at_least_one_rejection" };
  }
  const distinctApprovers = new Set(approvals.map((a) => a.decidedByUserId));
  if (
    snapshot.kind === "two_person_high_risk" &&
    distinctApprovers.size < 2
  ) {
    return {
      status: "pending",
      awaiting: Math.max(0, 2 - distinctApprovers.size),
    };
  }
  if (distinctApprovers.size >= snapshot.requiredApprovers) {
    return { status: "approved" };
  }
  return {
    status: "pending",
    awaiting: Math.max(0, snapshot.requiredApprovers - distinctApprovers.size),
  };
}

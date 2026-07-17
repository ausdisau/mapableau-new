import { describe, expect, it } from "vitest";

import {
  evaluateApproval,
  hashApprovalInputs,
  type ApprovalRequestSnapshot,
} from "@/lib/aura/approvals/binding";

function baseSnapshot(
  overrides: Partial<ApprovalRequestSnapshot> = {}
): ApprovalRequestSnapshot {
  return {
    id: "ap1",
    kind: "participant_step_confirm",
    requiredApprovers: 1,
    inputHash: "h_original",
    status: "pending",
    expiresAt: null,
    decisions: [],
    ...overrides,
  };
}

describe("approval binding", () => {
  it("hash is stable across key ordering", () => {
    const a = hashApprovalInputs({ b: 1, a: 2 });
    const b = hashApprovalInputs({ a: 2, b: 1 });
    expect(a).toBe(b);
  });

  it("invalidates when input hash changes", () => {
    const snapshot = baseSnapshot({
      decisions: [
        {
          id: "d1",
          decidedByUserId: "u1",
          decision: "approved",
          createdAt: new Date(),
        },
      ],
    });
    const v = evaluateApproval({
      snapshot,
      currentInputHash: "h_different",
      now: new Date(),
    });
    expect(v.status).toBe("invalidated");
  });

  it("two-person high-risk requires distinct approvers", () => {
    const now = new Date();
    const snapshot = baseSnapshot({
      kind: "two_person_high_risk",
      requiredApprovers: 2,
      decisions: [
        { id: "d1", decidedByUserId: "u1", decision: "approved", createdAt: now },
        { id: "d2", decidedByUserId: "u1", decision: "approved", createdAt: now },
      ],
    });
    const v = evaluateApproval({
      snapshot,
      currentInputHash: "h_original",
      now,
    });
    // Only one distinct approver — must still be pending.
    expect(v.status).toBe("pending");
  });

  it("two-person high-risk approves with two distinct approvers", () => {
    const now = new Date();
    const snapshot = baseSnapshot({
      kind: "two_person_high_risk",
      requiredApprovers: 2,
      decisions: [
        { id: "d1", decidedByUserId: "u1", decision: "approved", createdAt: now },
        { id: "d2", decidedByUserId: "u2", decision: "approved", createdAt: now },
      ],
    });
    const v = evaluateApproval({
      snapshot,
      currentInputHash: "h_original",
      now,
    });
    expect(v.status).toBe("approved");
  });

  it("any rejection => rejected verdict", () => {
    const now = new Date();
    const snapshot = baseSnapshot({
      decisions: [
        { id: "d1", decidedByUserId: "u1", decision: "rejected", createdAt: now },
      ],
    });
    const v = evaluateApproval({
      snapshot,
      currentInputHash: "h_original",
      now,
    });
    expect(v.status).toBe("rejected");
  });

  it("respects expiry", () => {
    const now = new Date("2026-07-16T00:00:00Z");
    const snapshot = baseSnapshot({
      expiresAt: new Date("2026-07-15T00:00:00Z"),
    });
    const v = evaluateApproval({
      snapshot,
      currentInputHash: "h_original",
      now,
    });
    expect(v.status).toBe("expired");
  });
});

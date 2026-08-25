import { describe, expect, it } from "vitest";
import {
  assertRecoveryAuthority, FORBIDDEN_AUTO_OPERATIONS, participantMustDecide,
} from "@/lib/ai/platform/recovery";

describe("Recovery authority", () => {
  it("forbids automatic worker assign, booking, payment, disclosure", () => {
    for (const op of [
      "assign_worker", "book_transport", "approve_payment", "disclose_disability",
      "change_consent", "contact_employer", "clinical_decision", "safeguarding_substantiation",
    ]) {
      expect(assertRecoveryAuthority({
        operation: op, materialityGate: "PLAN_RECOMPUTE_ALLOWED",
      }).allowed).toBe(false);
    }
    expect(FORBIDDEN_AUTO_OPERATIONS.length).toBeGreaterThan(5);
  });

  it("allows read-only recovery planning", () => {
    expect(assertRecoveryAuthority({
      operation: "refresh_evidence", materialityGate: "PLAN_RECOMPUTE_ALLOWED",
    }).allowed).toBe(true);
  });

  it("blocks when materiality is BLOCKED or HUMAN_REVIEW", () => {
    expect(assertRecoveryAuthority({
      operation: "refresh_evidence", materialityGate: "BLOCKED",
    }).allowed).toBe(false);
    expect(assertRecoveryAuthority({
      operation: "refresh_evidence", materialityGate: "HUMAN_REVIEW_REQUIRED",
    }).allowed).toBe(false);
  });

  it("does not expand authority ceilings", () => {
    expect(participantMustDecide("PARTICIPANT_DECISION_REQUIRED")).toBe(true);
    expect(participantMustDecide("NON_MATERIAL")).toBe(false);
  });
});

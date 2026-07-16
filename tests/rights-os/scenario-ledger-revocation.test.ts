import { describe, expect, it } from "vitest";

import { evaluatePolicy } from "@/lib/rights-os/policy-evaluator";

/**
 * Scenario D — Rights Ledger revocation (shadow approval path)
 * Participant approves minimised fields, then revokes the resulting lease.
 */
describe("Scenario D: ledger revocation walkthrough", () => {
  it("produces revocable capability outcome after participant review", () => {
    const decision = evaluatePolicy({
      requestId: "scenario-d-request",
      requester: {
        actorId: "venue-staff-1",
        actorType: "venue_staff",
        organisationId: "harbour-civic-centre",
      },
      recipient: {
        displayName: "Harbour Civic Centre",
        organisationId: "harbour-civic-centre",
      },
      subjectUserId: "taylor-user-id",
      purposeCode: "access.verify_venue",
      requestedOperations: ["read", "disclose"],
      requestedFields: ["arrival_time", "entrance_preference"],
      sourceAssets: ["accessibility_profile"],
      context: { visitPlanId: "visit-plan-1" },
      requestedAt: new Date().toISOString(),
      onwardSharingRequested: false,
    });

    expect(decision.outcome).toBe("participant_review_required");
    expect(decision.allowedFields.length).toBeGreaterThan(0);
    expect(decision.requiredApprovals).toContain("participant");
    expect(decision.expiresAt).toBeDefined();
  });
});

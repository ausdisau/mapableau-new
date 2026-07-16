import { describe, expect, it } from "vitest";

import { evaluatePolicy } from "@/lib/rights-os/policy-evaluator";
import { explainPolicyDecision } from "@/lib/rights-os/explain";

/**
 * Scenario A — Venue Access Capsule (shadow evaluation)
 * Taylor / Harbour Civic Centre / interview arrival assistance
 */
describe("Scenario A: venue access capsule shadow", () => {
  it("minimises fields and requires participant review", () => {
    const decision = evaluatePolicy({
      requestId: "scenario-a-request",
      requester: {
        actorId: "venue-staff-1",
        actorType: "venue_staff",
        organisationId: "harbour-civic-centre",
        role: "venue_staff",
      },
      recipient: {
        displayName: "Harbour Civic Centre",
        organisationId: "harbour-civic-centre",
        serviceId: "venue-access",
      },
      subjectUserId: "taylor-user-id",
      purposeCode: "access.verify_venue",
      requestedOperations: ["read", "disclose"],
      requestedFields: [
        "arrival_time",
        "entrance_preference",
        "written_directions_preference",
        "assistance_request",
        "diagnosis",
        "access_passport.full",
        "support_worker.details",
      ],
      sourceAssets: ["access_passport", "accessibility_profile"],
      context: { visitPlanId: "visit-plan-1" },
      requestedAt: new Date().toISOString(),
      onwardSharingRequested: false,
    });

    expect(decision.outcome).toBe("participant_review_required");
    expect(decision.allowedFields).toEqual(
      expect.arrayContaining([
        "arrival_time",
        "entrance_preference",
        "written_directions_preference",
        "assistance_request",
      ])
    );
    expect(decision.deniedFields).toEqual(
      expect.arrayContaining(["diagnosis", "access_passport.full"])
    );

    const explanation = explainPolicyDecision(decision);
    expect(explanation.deniedSummary).toMatch(/diagnosis|access_passport/i);
    expect(explanation.participantAction).toMatch(/review|approve/i);
  });
});

describe("Scenario B: transport driver handover shadow", () => {
  it("permits trip fields and denies medical history", () => {
    const decision = evaluatePolicy({
      requestId: "scenario-b-request",
      requester: { actorId: "driver-1", actorType: "driver" },
      recipient: { displayName: "Metro Transport", organisationId: "transport-1" },
      subjectUserId: "taylor-user-id",
      purposeCode: "transport.driver_handover",
      requestedOperations: ["read"],
      requestedFields: [
        "pickup_point",
        "mobility.equipment_dimensions",
        "companion_count",
        "medical_history.full",
      ],
      sourceAssets: ["transport_trip"],
      context: { bookingId: "trip-1" },
      requestedAt: new Date().toISOString(),
      onwardSharingRequested: false,
    });

    expect(decision.allowedFields).toContain("pickup_point");
    expect(decision.deniedFields).toContain("medical_history.full");
    expect(decision.prohibitions.some((p) => p.code === "no_onward_share")).toBe(true);
  });
});

describe("Scenario F: employment adjustment", () => {
  it("denies diagnosis by default for adjustment purpose", () => {
    const decision = evaluatePolicy(
      {
        requestId: "scenario-f-request",
        requester: { actorId: "employer-1", actorType: "employer" },
        recipient: { displayName: "Acme Corp" },
        subjectUserId: "taylor-user-id",
        purposeCode: "jobs.request_adjustment",
        requestedOperations: ["read", "disclose"],
        requestedFields: ["diagnosis", "functional_requirements"],
        sourceAssets: ["accessibility_profile"],
        context: { employmentId: "job-1" },
        requestedAt: new Date().toISOString(),
        onwardSharingRequested: false,
      },
      { employerDiagnosisRequest: true }
    );

    expect(decision.outcome).toBe("participant_review_required");
    expect(decision.allowedFields).toContain("functional_requirements");
    expect(decision.deniedFields).toContain("diagnosis");
  });
});

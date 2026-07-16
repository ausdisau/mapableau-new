import { describe, expect, it } from "vitest";

import { compileFields } from "@/lib/rights-os/field-compiler";
import { detectPolicyConflicts } from "@/lib/rights-os/conflict-engine";
import { evaluatePolicy } from "@/lib/rights-os/policy-evaluator";
import {
  isRegisteredPurpose,
  isVaguePurpose,
  validatePurposeCode,
} from "@/lib/rights-os/purpose-registry";
import { explainPolicyDecision } from "@/lib/rights-os/explain";
import { rightsOsConfig } from "@/lib/rights-os/config";

describe("purpose registry", () => {
  it("rejects missing purpose", () => {
    expect(validatePurposeCode("").valid).toBe(false);
    expect(validatePurposeCode("").reason).toBe("PURPOSE_MISSING");
  });

  it("rejects vague purposes", () => {
    expect(isVaguePurpose("personalisation")).toBe(true);
    expect(validatePurposeCode("personalisation").valid).toBe(false);
  });

  it("accepts registered purposes", () => {
    expect(isRegisteredPurpose("access.verify_venue")).toBe(true);
    expect(validatePurposeCode("access.verify_venue").valid).toBe(true);
  });
});

describe("field compiler", () => {
  it("prohibits diagnosis for venue verification", () => {
    const result = compileFields({
      purposeCode: "access.verify_venue",
      requestedFields: ["arrival_time", "diagnosis", "access_passport.full"],
      requestedOperations: ["read"],
    });
    expect(result.required).toContain("arrival_time");
    expect(result.prohibited).toContain("diagnosis");
    expect(result.prohibited).toContain("access_passport.full");
  });

  it("permits transport handover fields", () => {
    const result = compileFields({
      purposeCode: "transport.driver_handover",
      requestedFields: ["pickup_point", "mobility.equipment_dimensions"],
      requestedOperations: ["read"],
    });
    expect(result.required).toContain("pickup_point");
    expect(result.required).toContain("mobility.equipment_dimensions");
  });
});

describe("policy evaluator", () => {
  const baseRequest = {
    requestId: "test-request-1",
    requester: { actorId: "org-1", actorType: "venue_staff" },
    recipient: { displayName: "Harbour Civic Centre", organisationId: "venue-1" },
    subjectUserId: "participant-1",
    purposeCode: "access.verify_venue",
    requestedOperations: ["read", "disclose"] as const,
    requestedFields: ["arrival_time", "entrance_preference", "diagnosis", "access_passport.full"],
    sourceAssets: ["accessibility_profile"],
    context: {},
    requestedAt: new Date().toISOString(),
    onwardSharingRequested: false,
  };

  it("returns participant_review_required for venue scenario", () => {
    const decision = evaluatePolicy({
      ...baseRequest,
      requestedOperations: ["read", "disclose"],
    });
    expect(decision.outcome).toBe("participant_review_required");
    expect(decision.allowedFields).toContain("arrival_time");
    expect(decision.allowedFields).toContain("entrance_preference");
    expect(decision.deniedFields).toContain("diagnosis");
    expect(decision.deniedFields).toContain("access_passport.full");
  });

  it("denies missing purpose", () => {
    const decision = evaluatePolicy({ ...baseRequest, purposeCode: "" });
    expect(decision.outcome).toBe("deny");
  });

  it("denies vague purpose", () => {
    const decision = evaluatePolicy({ ...baseRequest, purposeCode: "analytics" });
    expect(decision.outcome).toBe("deny");
  });

  it("denies unregistered purpose", () => {
    const decision = evaluatePolicy({ ...baseRequest, purposeCode: "unknown.purpose" });
    expect(decision.outcome).toBe("deny");
  });

  it("requires human review for employment diagnosis conflict", () => {
    const conflict = detectPolicyConflicts(
      { ...baseRequest, purposeCode: "jobs.request_adjustment" },
      { employerDiagnosisRequest: true }
    );
    expect(conflict.hasConflict).toBe(true);
    expect(conflict.safeDefault).toBe("participant_review_required");
  });

  it("produces stable reason codes", () => {
    const decision = evaluatePolicy(baseRequest);
    expect(decision.reasons.length).toBeGreaterThan(0);
    expect(decision.reasons.every((r) => r.code && r.message)).toBe(true);
  });

  it("explains decision in plain language", () => {
    const decision = evaluatePolicy(baseRequest);
    const explanation = explainPolicyDecision(decision);
    expect(explanation.decision).toMatch(/review|Denied|Allowed/i);
    expect(explanation.participantAction.length).toBeGreaterThan(0);
  });
});

describe("rights config defaults", () => {
  it("disables RightsOS by default", () => {
    expect(rightsOsConfig.enabled).toBe(false);
    expect(rightsOsConfig.mode).toBe("shadow");
  });
});

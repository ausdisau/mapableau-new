import { describe, expect, it } from "vitest";

import {
  SupportNeedsAssessorBodySchema,
  SupportNeedsAssessorSubmitSchema,
} from "@/lib/intake/support-needs-assessor";

describe("SupportNeedsAssessorBodySchema", () => {
  it("accepts a skip payload", () => {
    const result = SupportNeedsAssessorBodySchema.safeParse({ skipped: true });
    expect(result.success).toBe(true);
  });

  it("rejects empty selected areas", () => {
    const result = SupportNeedsAssessorSubmitSchema.safeParse({
      selectedAreas: [],
      answers: [],
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects answers that do not match selected areas", () => {
    const result = SupportNeedsAssessorSubmitSchema.safeParse({
      selectedAreas: ["mobility"],
      answers: [{ domainId: "communication", intensity: "some" }],
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects priority outside selected areas", () => {
    const result = SupportNeedsAssessorSubmitSchema.safeParse({
      selectedAreas: ["mobility"],
      answers: [{ domainId: "mobility", intensity: "a_little" }],
      priorityArea: "self_care",
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid lite submit", () => {
    const result = SupportNeedsAssessorSubmitSchema.safeParse({
      selectedAreas: ["mobility", "communication"],
      answers: [
        { domainId: "mobility", intensity: "a_lot" },
        { domainId: "communication", intensity: "some" },
      ],
      priorityArea: "mobility",
      anythingElse: "Need help with transfers",
      consentDraftProcessing: true,
      consentNoClinicalPaste: true,
    });
    expect(result.success).toBe(true);
  });
});


describe("participant self-report", () => {
  it("accepts communication preferences without converting them to instrument results", () => {
    const r = SupportNeedsAssessorSubmitSchema.parse({
      selectedAreas:["communication"], answers:[{domainId:"communication",intensity:"some"}],
      consentDraftProcessing:true, consentNoClinicalPaste:true,
      communicationAccess:"AAC and extra response time",
    });
    expect(r.communicationAccess).toBe("AAC and extra response time");
  });
});

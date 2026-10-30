import { describe, expect, it } from "vitest";
import { buildParticipantSupportSnapshot, classifyStoredSupportNeedsRecord } from "@/lib/intake/participant-support-snapshot";
import { SupportNeedsAssessorSubmitSchema } from "@/lib/intake/support-needs-assessor";
describe("participant authored intake", () => {
 it("never treats unselected life areas as no support needs", () => {
  const form = SupportNeedsAssessorSubmitSchema.parse({
   selectedAreas: ["mobility"], answers: [{ domainId:"mobility", intensity:"some" }],
   consentDraftProcessing: true, consentNoClinicalPaste: true,
   participantGoal: "Use public transport", communicationAccess: "Extra response time",
  });
  const record = buildParticipantSupportSnapshot(form);
  expect(record.unselectedAreasMean).toBe("not_assessed");
  expect(record.areas).toHaveLength(1);
  expect(record.officialAssessment).toBe(false);
  expect(record.instrument).toBeNull();
  expect(record.communicationAccess).toBe("Extra response time");
 });
 it("rejects duplicate life area answers", () => {
  const x = SupportNeedsAssessorSubmitSchema.safeParse({
   selectedAreas:["mobility","mobility"],
   answers:[{domainId:"mobility",intensity:"some"},{domainId:"mobility",intensity:"a_lot"}],
   consentDraftProcessing:true,consentNoClinicalPaste:true,
  });
  expect(x.success).toBe(false);
 });
});

describe("legacy intake classification", () => {
 it("does not silently convert an old registration I-CAN-shaped payload into a participant statement", () => {
  expect(classifyStoredSupportNeedsRecord({
   source: "registration_assessor",
   domains: { mobility: { supportNeedLevel: "none", completed: true } },
  })).toBe("legacy_registration");
 });
 it("recognises a versioned participant statement", () => {
  const valid = SupportNeedsAssessorSubmitSchema.parse({
   selectedAreas: ["communication"],
   answers: [{ domainId: "communication", intensity: "some" }],
   consentDraftProcessing: true, consentNoClinicalPaste: true,
  });
  expect(classifyStoredSupportNeedsRecord(buildParticipantSupportSnapshot(valid))).toBe("participant_self_report");
 });
 it("keeps unknown, skipped and official-style drafts separate", () => {
  expect(classifyStoredSupportNeedsRecord({ skipped: true })).toBe("skipped");
  expect(classifyStoredSupportNeedsRecord({ domains: {} })).toBe("legacy_ican_draft");
  expect(classifyStoredSupportNeedsRecord({ schemaVersion: 99, recordType: "participant_authored_support_snapshot" })).toBe("unknown");
  expect(classifyStoredSupportNeedsRecord(null)).toBe("unknown");
 });
});

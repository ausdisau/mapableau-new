import { describe, expect, it } from "vitest";
import { buildParticipantSupportSnapshot } from "@/lib/intake/participant-support-snapshot";
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

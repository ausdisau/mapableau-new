import { describe, expect, it } from "vitest";

import {
  assertNoDiagnosisDisclosure,
  buildInterviewAccessChecklist,
  filterApprovedFunctionalFields,
} from "@/lib/access-intelligence/employment";

describe("System 9 employment orchestration", () => {
  it("omits unapproved fields and blocks diagnosis keys", () => {
    const disclosure = filterApprovedFunctionalFields({
      requestedFields: ["step_free", "diagnosis"],
      approvedFields: ["step_free"],
    });
    expect(disclosure.shared).toEqual(["step_free"]);
    expect(disclosure.omitted).toContain("diagnosis");
    expect(() => assertNoDiagnosisDisclosure(["medical_diagnosis"])).toThrow();
  });

  it("builds interview checklist without inventing compliance", () => {
    const checklist = buildInterviewAccessChecklist({
      interviewFormat: "in_person",
      hasAccessibleTransport: true,
      hasSupportWorker: false,
      roomRouteKnown: true,
      quietWaitingKnown: null,
      toiletKnown: true,
    });
    expect(checklist.items.some((i) => i.code === "quiet_waiting" && i.status === "unknown")).toBe(
      true,
    );
  });
});

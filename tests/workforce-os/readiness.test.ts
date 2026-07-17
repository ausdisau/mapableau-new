import { describe, expect, it } from "vitest";

import {
  computeWorkerReadiness,
  listExpiringCredentials,
} from "@/lib/workforce-os";
import { taylorSupportWorker } from "@/lib/workforce-os/taylor-worker";

describe("Workforce readiness projection", () => {
  it("blocks Taylor worker when AAC observation and intro missing", () => {
    const result = computeWorkerReadiness(taylorSupportWorker, {
      workerProfileId: taylorSupportWorker.workerProfileId,
      organisationId: taylorSupportWorker.organisationId,
      purpose: "assignment_readiness",
      requiredCompetencies: ["communication_aac", "power_chair_transport"],
      participantIntroductionRequired: true,
    });

    expect(result.qualityScore).toBeNull();
    expect(result.assignmentReadiness).toBe("blocked");
    expect(result.blockers.length).toBeGreaterThan(0);
    expect(
      result.checks.some(
        (c) =>
          c.key === "competency:communication_aac" &&
          c.detail?.includes("does not prove")
      )
    ).toBe(true);
    expect(
      result.checks.some((c) => c.key === "competency:power_chair_transport")
    ).toBe(true);
    expect(
      result.checks.some(
        (c) =>
          c.key === "participant_introduction" && c.status === "not_completed"
      )
    ).toBe(true);
  });

  it("lists expiring credentials within horizon", () => {
    const expiring = listExpiringCredentials(
      {
        ...taylorSupportWorker,
        trustCredentials: [
          {
            credentialType: "first_aid",
            status: "verified",
            expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
      30
    );
    expect(expiring).toHaveLength(1);
    expect(expiring[0]?.credentialType).toBe("first_aid");
  });

  it("marks ready only when all required evidence present", () => {
    const result = computeWorkerReadiness(
      {
        ...taylorSupportWorker,
        learningEvidence: [
          {
            competencyKey: "communication_aac",
            evidenceClasses: [
              "course_completion",
              "assessment_passed",
              "supervisor_observed",
            ],
          },
        ],
        requiredCompetencies: ["communication_aac"],
        participantIntroductionCompleted: true,
      },
      {
        workerProfileId: taylorSupportWorker.workerProfileId,
        organisationId: taylorSupportWorker.organisationId,
        purpose: "test",
        requiredCompetencies: ["communication_aac"],
        participantIntroductionRequired: true,
      }
    );
    expect(result.assignmentReadiness).toBe("ready");
    expect(result.status).toBe("ready");
  });
});

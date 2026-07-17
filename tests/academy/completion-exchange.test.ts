import { describe, expect, it } from "vitest";

import {
  exchangeLearningCompletion,
  getAcademyCatalogueShell,
  getAcademySsoArchitecture,
} from "@/lib/academy";

describe("MapAble Academy foundation", () => {
  it("defines SSO architecture without iframes", () => {
    const sso = getAcademySsoArchitecture();
    expect(sso.iframeForbidden).toBe(true);
    expect(sso.completionWebhook.createsCompetencyAutomatically).toBe(false);
    expect(sso.pattern).toBe("oidc_sso_from_mapable_core");
  });

  it("exposes catalogue shell with schools", () => {
    const catalogue = getAcademyCatalogueShell();
    expect(catalogue.courses.length).toBeGreaterThan(0);
    expect(catalogue.externalLms.frappe.licence).toBe("AGPL-3.0");
    expect(catalogue.externalLms.frappe.enabledByDefault).toBe(false);
    expect(catalogue.iframeEmbedding).toBe(false);
  });

  it("exchange does not auto-certify from completion alone", () => {
    const result = exchangeLearningCompletion({
      completion: {
        id: "c1",
        learnerUserId: "u1",
        courseCode: "COMM-AAC-101",
        courseTitle: "AAC",
        completedAt: "2026-07-01T00:00:00.000Z",
        evidenceClass: "course_completion",
        provider: "mapable_academy",
        isSynthetic: true,
      },
      competencyKey: "communication_aac",
      workerProfileId: "w1",
    });
    expect(result.competencyEvidence.competencyProved).toBe(false);
    expect(result.competencyEvidence.humanReviewRequired).toBe(true);
    expect(result.workforceBridge.mayAutoCertify).toBe(false);
    expect(result.workforceBridge.mayAutoAssign).toBe(false);
  });

  it("proves competency only with completion, assessment, and observation", () => {
    const result = exchangeLearningCompletion({
      completion: {
        id: "c2",
        learnerUserId: "u1",
        courseCode: "COMM-AAC-101",
        courseTitle: "AAC",
        completedAt: "2026-07-01T00:00:00.000Z",
        evidenceClass: "course_completion",
        provider: "mapable_academy",
      },
      assessment: {
        id: "a1",
        learnerUserId: "u1",
        assessmentCode: "QUIZ",
        passed: true,
        evidenceClass: "assessment_passed",
        assessedAt: "2026-07-02T00:00:00.000Z",
      },
      observationEvidenceClasses: ["supervisor_observed"],
      competencyKey: "communication_aac",
      workerProfileId: "w1",
    });
    expect(result.competencyEvidence.competencyProved).toBe(true);
  });
});

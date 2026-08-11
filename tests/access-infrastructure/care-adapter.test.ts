import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccessRequirement } from "@/lib/access/infrastructure/types";

const flagState = vi.hoisted(() => ({
  enabled: true,
  careMatching: true,
}));

vi.mock("@/lib/access/infrastructure/flags", () => ({
  accessInfrastructureFlags: {
    get enabled() {
      return flagState.enabled;
    },
    get careMatching() {
      return flagState.careMatching;
    },
    get passport() {
      return true;
    },
    get compatibilityEngine() {
      return true;
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    careRequest: { findUnique: vi.fn() },
    careAccessNeed: { findMany: vi.fn() },
    workerProfile: { findMany: vi.fn(), findUnique: vi.fn() },
    accessAuditEvent: { create: vi.fn() },
  },
}));

vi.mock("@/lib/access/infrastructure/passport-service", () => ({
  getPassportForUser: vi.fn(),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getPassportForUser } from "@/lib/access/infrastructure/passport-service";
import {
  assessWorkerCareCompatibility,
  compileCareRequirements,
  filterSufficientlyCompatibleWorkers,
  projectWorkerCapabilities,
  suggestCompatibleWorkers,
} from "@/lib/access/infrastructure/adapters/care";
import { CARE_WORKER_DISCLOSURE_ATTRIBUTE_ALLOWLIST } from "@/lib/access/infrastructure/adapters/care/pre-shift-disclosure";
import { evaluateCompatibility } from "@/lib/access/infrastructure/engine/evaluate";

function careReq(
  id: string,
  ontologyConceptId: string,
  criticality: AccessRequirement["criticality"] = "required",
): AccessRequirement {
  return {
    id,
    passportId: "pp-care",
    ontologyConceptId,
    domain: ontologyConceptId.split(".")[0] as AccessRequirement["domain"],
    attribute: ontologyConceptId.split(".").pop()!,
    value: true,
    criticality,
    contextScope: "activity_specific",
    timing: "permanent",
    assistance: "optional",
    disclosureScopes: ["worker"],
    userConfirmed: true,
  };
}

describe("Care access adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flagState.enabled = true;
    flagState.careMatching = true;
  });

  it("projects verified competencies and marks pending/expired/disputed unusable", () => {
    const caps = projectWorkerCapabilities({
      workerProfileId: "w1",
      highIntensityCompetencyVerified: true,
      credentials: [
        {
          id: "cred-ok",
          credentialType: "first_aid",
          verificationStatus: "verified",
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: "cred-exp",
          credentialType: "wwcc",
          verificationStatus: "verified",
          expiresAt: new Date(Date.now() - 86400000),
        },
      ],
      competencies: [
        {
          id: "c-auslan",
          competencyType: "AUSLAN",
          verificationStatus: "verified",
        },
        {
          id: "c-personal",
          competencyType: "PERSONAL_CARE",
          verificationStatus: "pending",
        },
        {
          id: "c-complex",
          competencyType: "COMPLEX_SUPPORT",
          verificationStatus: "disputed",
        },
      ],
    });

    expect(
      caps.some((c) => c.ontologyConceptId === "auslan_language.auslan_available"),
    ).toBe(true);
    expect(
      caps.some((c) => c.ontologyConceptId === "service_staff.high_intensity_competency"),
    ).toBe(true);
    expect(caps.find((c) => c.id === "cap-comp-c-personal")?.status).toBe("unknown");
    expect(caps.find((c) => c.id === "cap-comp-c-complex")?.status).toBe("disputed");
    expect(caps.find((c) => c.id === "cap-cred-cred-exp")?.status).toBe("outdated");
  });

  it("matches required competency when verified", () => {
    const result = evaluateCompatibility({
      passportId: "pp-care",
      requirements: [careReq("r1", "auslan_language.auslan_available")],
      entityType: "support_provider",
      entityId: "w1",
      capabilities: [
        {
          id: "c1",
          entityType: "support_provider",
          entityId: "w1",
          ontologyConceptId: "auslan_language.auslan_available",
          attribute: "auslan_available",
          value: true,
          evidenceObservationId: "o1",
          status: "verified",
        },
      ],
      adjustments: [],
      contextTags: ["CARE"],
    });
    expect(result.state).toBe("compatible");
  });

  it("returns incompatible when required competency contradicts evidence", () => {
    const result = evaluateCompatibility({
      passportId: "pp-care",
      requirements: [careReq("r1", "auslan_language.auslan_available")],
      entityType: "support_provider",
      entityId: "w1",
      capabilities: [
        {
          id: "c1",
          entityType: "support_provider",
          entityId: "w1",
          ontologyConceptId: "auslan_language.auslan_available",
          attribute: "auslan_available",
          value: false,
          evidenceObservationId: "o1",
          status: "verified",
        },
      ],
      adjustments: [],
      contextTags: ["CARE"],
    });
    expect(result.state).toBe("incompatible");
    expect(result.findings.some((f) => f.result === "mismatch")).toBe(true);
  });

  it("returns uncertain when competency evidence is unknown", () => {
    const result = evaluateCompatibility({
      passportId: "pp-care",
      requirements: [careReq("r1", "self_care_continence.accessible_toilet")],
      entityType: "support_provider",
      entityId: "w1",
      capabilities: [
        {
          id: "c1",
          entityType: "support_provider",
          entityId: "w1",
          ontologyConceptId: "self_care_continence.accessible_toilet",
          attribute: "personal_care",
          value: true,
          evidenceObservationId: "o1",
          status: "unknown",
        },
      ],
      adjustments: [],
      contextTags: ["CARE"],
    });
    expect(result.state).toBe("uncertain");
  });

  it("surfaces preference gaps without claiming guaranteed incompatibility", () => {
    const candidate = assessWorkerCareCompatibility({
      passportId: "pp-care",
      workerProfileId: "w1",
      requirements: [
        careReq("r1", "sensory_regulation.quiet_space", "preference"),
      ],
      capabilities: [],
    });
    expect(candidate.preferenceGaps).toContain("sensory_regulation.quiet_space");
    expect(candidate.productionClaim).toBe("none");
    expect(candidate.decisionOwner).toBe("PARTICIPANT");
    expect(candidate.summary.toLowerCase()).not.toContain("guaranteed");
  });

  it("compiles legacy CareAccessNeed as preference-only without diagnosis", () => {
    const requirements = compileCareRequirements({
      passportId: "pp-care",
      requirements: [],
      accessRequirementsSummary: "Needs calm pacing",
      legacyNeeds: [
        { id: "n1", category: "SENSORY_SUPPORT", summary: "Quiet environment preferred" },
      ],
    });
    expect(requirements.every((r) => r.criticality === "preference")).toBe(true);
    expect(requirements.every((r) => r.userConfirmed === false)).toBe(true);
    expect(JSON.stringify(requirements)).not.toMatch(/diagnos/i);
  });

  it("filters replacement pool to sufficiently compatible workers and escalates high complexity", () => {
    const accessByWorker = new Map([
      ["a", "compatible" as const],
      ["b", "uncertain" as const],
      ["c", "incompatible" as const],
    ]);
    const filtered = filterSufficientlyCompatibleWorkers(
      [{ workerId: "a" }, { workerId: "b" }, { workerId: "c" }],
      accessByWorker,
      { highComplexity: true },
    );
    expect(filtered.kept.map((c) => c.workerId)).toEqual(["a"]);
    expect(filtered.escalateToOperations).toBe(false);

    const none = filterSufficientlyCompatibleWorkers(
      [{ workerId: "b" }, { workerId: "c" }],
      accessByWorker,
      { highComplexity: true },
    );
    expect(none.kept).toEqual([]);
    expect(none.escalateToOperations).toBe(true);
  });

  it("returns empty candidates when care matching flag is off", async () => {
    flagState.careMatching = false;
    const result = await suggestCompatibleWorkers({ careRequestId: "cr1" });
    expect(result).toEqual([]);
    expect(prisma.careRequest.findUnique).not.toHaveBeenCalled();
  });

  it("suggestCompatibleWorkers returns empty when no workers in pool", async () => {
    vi.mocked(prisma.careRequest.findUnique).mockResolvedValue({
      id: "cr1",
      participantId: "u1",
      accessRequirementsSummary: null,
    } as never);
    vi.mocked(getPassportForUser).mockResolvedValue({
      id: "pp-care",
      requirements: [],
    } as never);
    vi.mocked(prisma.careAccessNeed.findMany).mockResolvedValue([]);
    vi.mocked(prisma.workerProfile.findMany).mockResolvedValue([]);

    const result = await suggestCompatibleWorkers({ careRequestId: "cr1" });
    expect(result).toEqual([]);
  });

  it("care_worker disclosure allowlist excludes diagnosis and employment attributes", () => {
    expect(CARE_WORKER_DISCLOSURE_ATTRIBUTE_ALLOWLIST).not.toContain("diagnosis");
    expect(CARE_WORKER_DISCLOSURE_ATTRIBUTE_ALLOWLIST).not.toContain(
      "medical_diagnosis",
    );
    expect(CARE_WORKER_DISCLOSURE_ATTRIBUTE_ALLOWLIST).not.toContain(
      "employment_status",
    );
    expect(CARE_WORKER_DISCLOSURE_ATTRIBUTE_ALLOWLIST).not.toContain("employer_name");
    expect(CARE_WORKER_DISCLOSURE_ATTRIBUTE_ALLOWLIST).toContain(
      "communication_supports",
    );
    expect(CARE_WORKER_DISCLOSURE_ATTRIBUTE_ALLOWLIST).toContain(
      "personal_care_supports",
    );
  });
});

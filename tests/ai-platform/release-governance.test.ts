import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assertCohortAccess,
  assessReleaseReadiness,
  emptyReleaseGateEvidence,
  evaluatePublicClaim,
  grantPilotCohortMembership,
  presentEvidence,
  resetPilotCohortStore,
  revokePilotCohortMembership,
  type MapAbleReleaseManifest,
  type ReleaseGateEvidence,
  ACCESSIBILITY_EVIDENCE_DIMENSIONS,
  OPERATIONS_CAPACITY_DIMENSIONS,
  SECURITY_EVIDENCE_DIMENSIONS,
} from "@/lib/ai/platform/release-governance";

const FLAG = "MAPABLE_RELEASE_GOVERNANCE_ENABLED";
const PILOT_FLAG = "MAPABLE_TEST_CAPABILITY_PILOT_ENABLED";

function fillEvidence(
  base: ReleaseGateEvidence,
  overrides?: Partial<ReleaseGateEvidence>
): ReleaseGateEvidence {
  const recordedAt = "2026-01-15T00:00:00.000Z";
  const accessibility = { ...base.accessibility };
  for (const dim of ACCESSIBILITY_EVIDENCE_DIMENSIONS) {
    accessibility[dim] = presentEvidence(`a11y/${dim}`, recordedAt);
  }
  const security = { ...base.security };
  for (const dim of SECURITY_EVIDENCE_DIMENSIONS) {
    security[dim] = presentEvidence(`sec/${dim}`, recordedAt);
  }
  const operationsCapacity = { ...base.operationsCapacity };
  for (const dim of OPERATIONS_CAPACITY_DIMENSIONS) {
    operationsCapacity[dim] = {
      ...presentEvidence(`ops/${dim}`, recordedAt),
      namedOwner: `owner-${dim}`,
    };
  }
  return {
    ...base,
    owner: {
      ...presentEvidence("manifest.owner", recordedAt),
      namedOwner: "ai-platform",
    },
    purpose: presentEvidence("docs/purpose.md", recordedAt),
    authorityCeiling: {
      ...presentEvidence("manifest.ceiling", recordedAt),
      ceiling: "SUGGEST_WITH_HUMAN_REVIEW",
    },
    privacyClassification: {
      ...presentEvidence("manifest.privacy", recordedAt),
      dataClasses: ["operational", "participant_pii"],
    },
    consentScopes: {
      ...presentEvidence("manifest.consent", recordedAt),
      scopes: ["ai.mission.assist"],
    },
    humanReviewPath: presentEvidence("docs/human-review.md", recordedAt),
    featureFlag: {
      ...presentEvidence("manifest.flag", recordedAt),
      flagName: PILOT_FLAG,
    },
    killSwitch: {
      ...presentEvidence("manifest.kill", recordedAt),
      killSwitchKey: "test.capability",
    },
    evaluationSuite: {
      ...presentEvidence("evals/test-suite", recordedAt),
      suiteId: "test-suite",
    },
    accessibility,
    security,
    rollbackPlan: presentEvidence("docs/rollback.md", recordedAt),
    operationalOwner: {
      ...presentEvidence("manifest.ops-owner", recordedAt),
      namedOwner: "ops-lead",
    },
    supportProcess: presentEvidence("docs/support.md", recordedAt),
    incidentProcess: presentEvidence("docs/incident.md", recordedAt),
    knownLimitations: {
      ...presentEvidence("manifest.limitations", recordedAt),
      limitations: ["Pilot only", "Human review required"],
    },
    operationsCapacity,
    ...overrides,
  };
}

function candidateManifest(
  evidence: ReleaseGateEvidence,
  extras?: Partial<MapAbleReleaseManifest>
): MapAbleReleaseManifest {
  return {
    capabilityKey: "test.capability",
    releaseState: "controlled_pilot_candidate",
    version: "0.1.0",
    allowedCohorts: ["pilot-wave-0"],
    domains: ["test"],
    requiredFlags: [PILOT_FLAG],
    requiredEvals: ["test-suite"],
    requiredHumanOperations: ["human_review"],
    knownLimitations: ["Pilot only"],
    privacyReviewRef: null,
    accessibilityReviewRef: null,
    securityReviewRef: null,
    rollbackPlanRef: null,
    owner: "ai-platform",
    approvedBy: null,
    approvedAt: null,
    expiresAt: null,
    evidence,
    relatedCapabilityMaturity: "experimental",
    ...extras,
  };
}

describe("release governance", () => {
  beforeEach(() => {
    process.env[FLAG] = "true";
    resetPilotCohortStore();
  });

  afterEach(() => {
    delete process.env[FLAG];
    resetPilotCohortStore();
  });

  it("blocks when evaluation suite evidence is missing", () => {
    const evidence = fillEvidence(emptyReleaseGateEvidence());
    evidence.evaluationSuite = {
      present: false,
      ref: null,
      recordedAt: null,
      suiteId: null,
    };
    const assessment = assessReleaseReadiness(candidateManifest(evidence));
    expect(assessment.verdict).toBe("NOT_READY");
    expect(
      assessment.failures.some((f) => f.code === "missing_evaluation_suite")
    ).toBe(true);
  });

  it("blocks when accessibility evidence is missing", () => {
    const evidence = fillEvidence(emptyReleaseGateEvidence());
    evidence.accessibility.keyboard = {
      present: false,
      ref: null,
      recordedAt: null,
    };
    const assessment = assessReleaseReadiness(candidateManifest(evidence));
    expect(assessment.verdict).toBe("NOT_READY");
    expect(
      assessment.failures.some(
        (f) => f.code === "missing_accessibility_keyboard"
      )
    ).toBe(true);
  });

  it("blocks when rollback plan evidence is missing", () => {
    const evidence = fillEvidence(emptyReleaseGateEvidence());
    evidence.rollbackPlan = { present: false, ref: null, recordedAt: null };
    const assessment = assessReleaseReadiness(candidateManifest(evidence));
    expect(assessment.verdict).toBe("NOT_READY");
    expect(
      assessment.failures.some((f) => f.code === "missing_rollback_plan")
    ).toBe(true);
  });

  it("blocks when operational owner evidence is missing", () => {
    const evidence = fillEvidence(emptyReleaseGateEvidence());
    evidence.operationalOwner = {
      present: false,
      ref: null,
      recordedAt: null,
      namedOwner: null,
    };
    const assessment = assessReleaseReadiness(candidateManifest(evidence));
    expect(assessment.verdict).toBe("NOT_READY");
    expect(
      assessment.failures.some((f) => f.code === "missing_operational_owner")
    ).toBe(true);
  });

  it("blocks when approval has expired", () => {
    const evidence = fillEvidence(emptyReleaseGateEvidence());
    const assessment = assessReleaseReadiness(
      candidateManifest(evidence, {
        releaseState: "controlled_pilot",
        approvedBy: "release-approver",
        approvedAt: "2025-01-01T00:00:00.000Z",
        expiresAt: "2025-02-01T00:00:00.000Z",
      }),
      { now: new Date("2026-01-01T00:00:00.000Z") }
    );
    expect(assessment.verdict).toBe("BLOCKED");
    expect(assessment.failures.some((f) => f.code === "approval_expired")).toBe(
      true
    );
  });

  it("enforces server-side cohort membership", () => {
    const evidence = fillEvidence(emptyReleaseGateEvidence());
    const manifest = candidateManifest(evidence, {
      releaseState: "controlled_pilot",
      approvedBy: "release-approver",
      approvedAt: "2026-01-01T00:00:00.000Z",
    });

    const denied = assertCohortAccess({
      manifest,
      tenantId: "tenant-a",
      participantId: "participant-1",
      serverFlags: { [PILOT_FLAG]: true },
    });
    expect(denied.allowed).toBe(false);

    grantPilotCohortMembership({
      cohortId: "pilot-wave-0",
      tenantId: "tenant-a",
      participantId: "participant-1",
      capabilityKey: "test.capability",
      grantedBy: "ops-lead",
      auditNote: "invited for controlled pilot rehearsal",
    });

    const allowed = assertCohortAccess({
      manifest,
      tenantId: "tenant-a",
      participantId: "participant-1",
      serverFlags: { [PILOT_FLAG]: true },
    });
    expect(allowed.allowed).toBe(true);
  });

  it("enforces server-side required flags", () => {
    const evidence = fillEvidence(emptyReleaseGateEvidence());
    const manifest = candidateManifest(evidence, {
      releaseState: "controlled_pilot",
      approvedBy: "release-approver",
      approvedAt: "2026-01-01T00:00:00.000Z",
    });
    grantPilotCohortMembership({
      cohortId: "pilot-wave-0",
      tenantId: "tenant-a",
      participantId: "participant-1",
      capabilityKey: "test.capability",
      grantedBy: "ops-lead",
      auditNote: "invited",
    });
    const denied = assertCohortAccess({
      manifest,
      tenantId: "tenant-a",
      participantId: "participant-1",
      serverFlags: { [PILOT_FLAG]: false },
    });
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toContain("required_flag_off");
  });

  it("blocks suspended releases", () => {
    const evidence = fillEvidence(emptyReleaseGateEvidence());
    const assessment = assessReleaseReadiness(
      candidateManifest(evidence, { releaseState: "suspended" })
    );
    expect(assessment.verdict).toBe("BLOCKED");
    expect(assessment.failures.some((f) => f.code === "release_suspended")).toBe(
      true
    );
  });

  it("rejects public claim mismatches for experimental state", () => {
    const result = evaluatePublicClaim({
      capabilityKey: "test.capability",
      releaseState: "experimental",
      claimText: "This is NDIA approved and production proven",
      publicSurface: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.failures.some((f) => f.gate === "claims")).toBe(true);
  });

  it("revokes cohort membership", () => {
    grantPilotCohortMembership({
      cohortId: "pilot-wave-0",
      tenantId: "tenant-a",
      participantId: "participant-1",
      capabilityKey: "test.capability",
      grantedBy: "ops-lead",
      auditNote: "invited",
    });
    const revoked = revokePilotCohortMembership({
      tenantId: "tenant-a",
      participantId: "participant-1",
      capabilityKey: "test.capability",
      revokedBy: "ops-lead",
    });
    expect(revoked?.revokedAt).toBeTruthy();
  });

  it("fail-closes when governance flag is off", () => {
    delete process.env[FLAG];
    const evidence = fillEvidence(emptyReleaseGateEvidence());
    const assessment = assessReleaseReadiness(candidateManifest(evidence));
    expect(assessment.verdict).toBe("BLOCKED");
    expect(assessment.governanceEnforcementActive).toBe(false);
  });

  it("returns READY_FOR_REVIEW when candidate evidence is complete", () => {
    const evidence = fillEvidence(emptyReleaseGateEvidence());
    const assessment = assessReleaseReadiness(candidateManifest(evidence));
    expect(assessment.verdict).toBe("READY_FOR_REVIEW");
    expect(assessment.failures).toHaveLength(0);
  });

  it("never returns AUTO_APPROVED", () => {
    const evidence = fillEvidence(emptyReleaseGateEvidence());
    const assessment = assessReleaseReadiness(candidateManifest(evidence));
    expect(String(assessment.verdict)).not.toBe("AUTO_APPROVED");
  });
});

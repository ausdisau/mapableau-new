import { describe, expect, it } from "vitest";

import {
  CONTINUITY_OS_PERMANENT_PROHIBITIONS,
  canExecuteRecoveryActions,
  continuityOsConfig,
  isContinuityOsEnabled,
  isLifeEventsEnabled,
  isShadowMode,
} from "@/lib/continuity-os/config";
import { projectLifeEventDependencies } from "@/lib/continuity-os/dependency-projection";
import { classifyFailureSignal } from "@/lib/continuity-os/failure";
import { summariseFriction } from "@/lib/continuity-os/friction";
import {
  canTransitionHandoff,
  handoffCompletionClaim,
} from "@/lib/continuity-os/handoff";
import { calculateFailureImpact } from "@/lib/continuity-os/impact";
import { buildMilestoneViews } from "@/lib/continuity-os/milestone-engine";
import {
  getPlaybook,
  isSpecialistHighRiskPlaybook,
  listPlaybooks,
} from "@/lib/continuity-os/playbooks";
import {
  buildRecoveryReceipt,
  detectFalseRecovery,
} from "@/lib/continuity-os/receipts";
import {
  compareRecoveryOptions,
  generateRecoveryOptions,
} from "@/lib/continuity-os/recovery-options";
import { assessResilience } from "@/lib/continuity-os/resilience";
import {
  assertSupportedLifeEventType,
  getLifeEventRegistryMeta,
  getLifeEventType,
  listLifeEventTypes,
} from "@/lib/continuity-os/taxonomy";
import pilot from "@/data/continuity-os/pilot/start-job-transport-cancel.json";

describe("ContinuityOS feature flags", () => {
  it("defaults all capabilities fail-closed", () => {
    expect(isContinuityOsEnabled()).toBe(false);
    expect(isLifeEventsEnabled()).toBe(false);
    expect(continuityOsConfig.mode).toBe("shadow");
    expect(isShadowMode()).toBe(true);
    expect(canExecuteRecoveryActions()).toBe(false);
    expect(continuityOsConfig.automaticAssignmentEnabled).toBe(false);
    expect(continuityOsConfig.automaticCancellationEnabled).toBe(false);
    expect(continuityOsConfig.automaticPaymentEnabled).toBe(false);
    expect(continuityOsConfig.clinicalActionsEnabled).toBe(false);
    expect(continuityOsConfig.physicalActionsEnabled).toBe(false);
  });

  it("lists permanent prohibitions", () => {
    expect(CONTINUITY_OS_PERMANENT_PROHIBITIONS).toContain(
      "MAPABLE_RECOVERY_AUTOMATIC_ASSIGNMENT_ENABLED"
    );
  });
});

describe("Life event registry", () => {
  it("loads versioned registry with start_job", () => {
    const meta = getLifeEventRegistryMeta();
    expect(meta.registryVersion).toBe("1.0.0");
    expect(listLifeEventTypes().some((t) => t.typeKey === "start_job")).toBe(
      true
    );
    const startJob = getLifeEventType("start_job");
    expect(startJob?.prohibitedAutomatedDecisions).toContain(
      "worker_assignment"
    );
    expect(startJob?.prohibitedAutomatedDecisions).toContain(
      "transport_booking"
    );
  });

  it("rejects unsupported types", () => {
    expect(() => assertSupportedLifeEventType("not_a_real_event")).toThrow(
      /Unsupported/
    );
  });
});

describe("Dependency projection", () => {
  it("preserves unknowns and responsibility labels for start_job", () => {
    const projection = projectLifeEventDependencies({
      typeKey: "start_job",
      typeVersion: "1.0.0",
      preservedUnknowns: ["reception_assistance"],
    });

    const reception = projection.nodes.find(
      (n) => n.id === "reception_assistance"
    );
    expect(reception?.state).toBe("unknown");
    expect(projection.unknowns).toContain("reception_assistance");
    expect(projection.singlePointsOfFailure).toEqual(
      expect.arrayContaining([
        "accessible_transport",
        "morning_support_worker",
      ])
    );
    expect(
      projection.responsibilitySummary.find(
        (r) => r.dependencyKey === "accessible_transport"
      )?.responsibility.recoveryResponsibility
    ).toMatch(/Transport/);
  });

  it("builds milestones that require evidence", () => {
    const projection = projectLifeEventDependencies({
      typeKey: "start_job",
      typeVersion: "1.0.0",
    });
    const milestones = buildMilestoneViews({
      typeKey: "start_job",
      typeVersion: "1.0.0",
      projection,
    });
    expect(milestones.every((m) => m.evidenceRequired)).toBe(true);
    expect(milestones.every((m) => m.canModelDeclareComplete === false)).toBe(
      true
    );
  });
});

describe("Resilience pre-mortem", () => {
  it("returns SPOFs without participant score", () => {
    const projection = projectLifeEventDependencies({
      typeKey: "start_job",
      typeVersion: "1.0.0",
    });
    const result = assessResilience({
      typeKey: "start_job",
      typeVersion: "1.0.0",
      projection,
      preferences: { avoidUnfamiliarWorkers: true },
    });
    expect(result.participantScore).toBeNull();
    expect(result.singlePointsOfFailure.length).toBeGreaterThan(0);
    expect(result.preferencesHonoured).toContain("avoidUnfamiliarWorkers");
  });
});

describe("Failure classification and impact", () => {
  it("classifies transport cancellation as availability and never blames participant", () => {
    const classified = classifyFailureSignal({
      source: "transport-operator",
      sourceType: "transport",
      service: "accessible_transport",
      observedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      confidence: "high",
      urgency: "high",
      publicOrPrivate: "private",
      affectedDependencyId: "accessible_transport",
      verificationRequirement: "canonical_transport_event",
      rawSummary: "Accessible transport vehicle cancelled 70 minutes before first day",
    }, { essentialService: true });

    expect(classified.failureClass).toBe("AVAILABILITY");
    expect(classified.describesServiceNotParticipant).toBe(true);
    expect(classified.severity).toBe("critical");
    expect(classified.playbookKeys).toContain(
      "accessible_transport_cancellation"
    );
  });

  it("rejects forged signals", () => {
    const classified = classifyFailureSignal(
      {
        source: "attacker",
        sourceType: "system",
        service: "transport",
        observedAt: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        confidence: "high",
        urgency: "critical",
        publicOrPrivate: "private",
        verificationRequirement: "signed_partner",
        rawSummary: "transport cancelled",
      },
      { forged: true }
    );
    expect(classified.verificationStatus).toBe("rejected_forged");
  });

  it("preserves prior plan when calculating impact", () => {
    const prior = projectLifeEventDependencies({
      typeKey: "start_job",
      typeVersion: "1.0.0",
      preservedUnknowns: ["reception_assistance"],
    });
    const impact = calculateFailureImpact({
      typeKey: "start_job",
      typeVersion: "1.0.0",
      failedDependencyId: "accessible_transport",
      priorProjection: prior,
      preservedUnknowns: ["reception_assistance"],
    });
    expect(impact.priorPlanPreserved).toBe(true);
    expect(impact.requiresParticipantReview).toBe(true);
    expect(
      impact.impactProjection.nodes.find((n) => n.id === "accessible_transport")
        ?.state
    ).toBe("failed");
    expect(
      impact.priorProjectionSnapshot.nodes.find(
        (n) => n.id === "accessible_transport"
      )?.state
    ).not.toBe("failed");
  });
});

describe("Recovery options and playbooks", () => {
  it("excludes inaccessible replacement vehicle", () => {
    const prior = projectLifeEventDependencies({
      typeKey: "start_job",
      typeVersion: "1.0.0",
    });
    const impact = calculateFailureImpact({
      typeKey: "start_job",
      typeVersion: "1.0.0",
      failedDependencyId: "accessible_transport",
      priorProjection: prior,
    });
    const options = generateRecoveryOptions({
      failureDependencyId: "accessible_transport",
      playbookKey: "accessible_transport_cancellation",
      impact,
      hardRequirements: ["ramp"],
      claimedReplacementFeatures: [],
      partnerConfirmedAvailable: true,
      knownAdditionalCost: "$45 estimated",
      preferences: { preserveOriginalAppointment: true },
    });
    const replacement = options.find(
      (o) => o.id === "replacement_accessible_transport"
    );
    expect(replacement?.availability).toBe("blocked");
    expect(replacement?.hardRequirementsMet).toBe(false);
    expect(replacement?.knownCost).toContain("$45");
    expect(
      options.some((o) => o.id === "human_transport_coordination")
    ).toBe(true);
    expect(
      options.every((o) => o.availability !== "verified_available")
    ).toBe(true);
  });

  it("blocks attend-without-worker for support cancellation", () => {
    const prior = projectLifeEventDependencies({
      typeKey: "start_job",
      typeVersion: "1.0.0",
    });
    const impact = calculateFailureImpact({
      typeKey: "start_job",
      typeVersion: "1.0.0",
      failedDependencyId: "morning_support_worker",
      priorProjection: prior,
    });
    const options = generateRecoveryOptions({
      failureDependencyId: "morning_support_worker",
      playbookKey: "support_worker_cancellation",
      impact,
      hardRequirements: [],
      preferences: { avoidUnfamiliarWorkers: true },
    });
    const comparison = compareRecoveryOptions(options);
    expect(
      comparison.excluded.some((o) => o.id === "attend_without_worker")
    ).toBe(true);
    expect(
      options.find((o) => o.id === "backup_worker_via_care")?.preferenceConflicts
    ).toContain("avoidUnfamiliarWorkers");
  });

  it("routes family violence playbook to human-only", () => {
    expect(isSpecialistHighRiskPlaybook("family_violence_safe_mode")).toBe(
      true
    );
    const playbook = getPlaybook("family_violence_safe_mode");
    expect(playbook?.prohibitedAssumptions.join(" ")).toMatch(/AURA/);
    expect(listPlaybooks().length).toBeGreaterThan(3);
  });
});

describe("Handoffs and receipts", () => {
  it("distinguishes sent, accepted, and task completion", () => {
    expect(canTransitionHandoff("received", "accepted")).toBe(true);
    expect(canTransitionHandoff("sent", "accepted")).toBe(false);
    const accepted = handoffCompletionClaim("accepted");
    expect(accepted.accepted).toBe(true);
    expect(accepted.tasksCompleted).toBe(false);
    const completed = handoffCompletionClaim("completed");
    expect(completed.tasksCompleted).toBe(true);
  });

  it("detects false recovery when operator acknowledges inaccessible replacement", () => {
    const falseRecovery = detectFalseRecovery({
      operatorAcknowledged: true,
      hardRequirementsMet: false,
    });
    expect(falseRecovery.isFalseRecovery).toBe(true);

    const receipt = buildRecoveryReceipt({
      originalGoal: pilot.lifeEvent.participantGoal,
      failure: pilot.failureSimulation.rawSummary,
      affectedServices: ["transport"],
      optionSelected: "replacement_accessible_transport",
      participantApprovalId: "participant:test",
      actionsTaken: ["operator_acknowledged_replacement"],
      recordsCreated: [],
      communicationsDelivered: [],
      handoffsAccepted: [],
      postconditions: [{ key: "ramp", passed: false }],
      remainingUnknowns: [],
      financialEffects: [],
      complaintOrReviewOptions: ["AccessibilityOps"],
      outcome: "restored",
      evidence: [],
      timestamp: new Date().toISOString(),
    });
    expect(receipt.participantGoalAchieved).toBe(false);
    expect(receipt.realWorldOutcomeConfirmed).toBe(false);
    expect(receipt.limitations.join(" ")).toMatch(/False-recovery/);
  });
});

describe("Friction ledger", () => {
  it("summarises system burden without participant score", () => {
    const summary = summariseFriction([
      {
        sourceService: "transport",
        workflow: "rebook",
        cause: "service_cancellation",
        participantActionRequired: "Approve replacement",
        timeBurdenMinutes: 40,
        avoidable: true,
        remediationOwner: "transport_operator",
      },
      {
        sourceService: "rights",
        workflow: "disclosure",
        cause: "repeated_disclosure",
        participantActionRequired: "Re-share fields",
        disclosureBurdenFields: 6,
        timeBurdenMinutes: 15,
        avoidable: true,
        remediationOwner: "provider",
      },
    ]);
    expect(summary.participantScore).toBeNull();
    expect(summary.eventCount).toBe(2);
    expect(summary.systemBurdenLabel).toBe("moderate");
  });
});

describe("Pilot fixture", () => {
  it("covers start_job + transport cancellation acceptance steps", () => {
    expect(pilot.lifeEvent.typeKey).toBe("start_job");
    expect(pilot.failureSimulation.affectedDependencyId).toBe(
      "accessible_transport"
    );
    expect(pilot.acceptanceWalkthrough.length).toBeGreaterThan(10);
  });
});

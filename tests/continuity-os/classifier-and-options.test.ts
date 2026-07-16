import { describe, expect, it } from "vitest";

import { classifyServiceFailure } from "@/lib/continuity-os/failures/classifier";
import {
  compareRecoveryOptions,
  generateRecoveryOptions,
} from "@/lib/continuity-os/recovery/options-engine";
import { requirePlaybook } from "@/lib/continuity-os/recovery/playbooks";
import { assessResilienceLevel } from "@/lib/continuity-os/resilience/pre-mortem";
import {
  CONTINUITY_OS_AI_PROHIBITED,
  identifyLifeEventTypeTool,
} from "@/lib/continuity-os/ai/tools";
import {
  continuityOsPermanentDeny,
  isShadowOrDemoMode,
} from "@/lib/continuity-os/feature-flags";

describe("Failure classification", () => {
  it("classifies transport cancellation without participant blame", () => {
    const result = classifyServiceFailure({
      trigger: "accessible_transport_cancellation",
      essentialServiceImpact: true,
      timeSensitive: true,
      noAlternative: true,
      safetyConcern: false,
      falseReassurance: false,
      hardRequirementFailed: false,
      dependentNodeCount: 3,
      evidenceConfidence: "medium",
      subscriptionTier: "enterprise",
    });
    expect(result.failureClass).toBe("AVAILABILITY");
    expect(["major", "critical"]).toContain(result.severity);
    expect(result.reasons).not.toContain("subscription");
  });

  it("routes family violence to human safety review", () => {
    const result = classifyServiceFailure({
      trigger: "family_violence_safe_mode",
      essentialServiceImpact: true,
      timeSensitive: true,
      noAlternative: true,
      safetyConcern: true,
      falseReassurance: false,
      hardRequirementFailed: false,
      dependentNodeCount: 0,
      evidenceConfidence: "unverified",
    });
    expect(result.severity).toBe("human_safety_review_required");
  });
});

describe("Recovery option engine", () => {
  it("excludes inaccessible replacement vehicles", () => {
    const options = generateRecoveryOptions({
      playbook: requirePlaybook("accessible_transport_cancellation"),
      originalGoal: "Arrive before 8:45 for first day",
      hardRequirements: ["accessible_vehicle"],
      preferences: { preserveAppointment: true },
      replacementVehicleAccessible: false,
      simulatedOnly: true,
    });
    const excluded = options.find(
      (o) => o.optionKey === "inaccessible_vehicle_excluded"
    );
    expect(excluded?.availabilityState).toBe("blocked");
    expect(excluded?.hardRequirementsMet).toBe(false);
    expect(
      options.every((o) => o.availabilityState !== "verified_available")
    ).toBe(true);
  });

  it("respects avoid unfamiliar workers preference", () => {
    const options = generateRecoveryOptions({
      playbook: requirePlaybook("support_worker_cancellation"),
      originalGoal: "Keep morning support",
      hardRequirements: [],
      preferences: { avoidUnfamiliarWorkers: true },
      replacementWorkerFamiliar: false,
    });
    expect(
      options.some((o) => o.optionKey === "unfamiliar_worker_excluded")
    ).toBe(true);
  });

  it("high-risk playbook only offers human pathway", () => {
    const options = generateRecoveryOptions({
      playbook: requirePlaybook("family_violence_safe_mode"),
      originalGoal: "Stay safe",
      hardRequirements: [],
      preferences: {},
    });
    expect(options).toHaveLength(1);
    expect(options[0]?.availabilityState).toBe("human_review_required");
  });

  it("comparison marks excluded options", () => {
    const options = generateRecoveryOptions({
      playbook: requirePlaybook("accessible_transport_cancellation"),
      originalGoal: "Arrive on time",
      hardRequirements: ["accessible_vehicle"],
      preferences: {},
      replacementVehicleAccessible: false,
    });
    const comparison = compareRecoveryOptions(options);
    expect(comparison.some((c) => c.excluded)).toBe(true);
  });
});

describe("Resilience and AI boundaries", () => {
  it("assesses environment resilience levels", () => {
    expect(
      assessResilienceLevel({
        singlePointsOfFailure: ["accessible_transport"],
        unconfirmedRequired: 1,
        verifiedFallbacks: 0,
      })
    ).toBe("no_verified_fallback");
  });

  it("keeps permanent deny defaults false", () => {
    expect(continuityOsPermanentDeny.automaticAssignment).toBe(false);
    expect(continuityOsPermanentDeny.automaticCancellation).toBe(false);
    expect(continuityOsPermanentDeny.clinicalActions).toBe(false);
    expect(continuityOsPermanentDeny.physicalActions).toBe(false);
  });

  it("defaults to shadow/demo mode when flags unset", () => {
    expect(isShadowOrDemoMode()).toBe(true);
  });

  it("lists prohibited AI functions and suggests life-event types only", () => {
    expect(CONTINUITY_OS_AI_PROHIBITED).toContain("worker_assignment");
    expect(CONTINUITY_OS_AI_PROHIBITED).toContain("action_execution");
    const suggestion = identifyLifeEventTypeTool({ hint: "job" });
    expect(suggestion.note).toMatch(/Suggestion only/i);
  });
});

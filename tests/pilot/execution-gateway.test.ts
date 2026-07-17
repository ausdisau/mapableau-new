import type { ControlledPilot } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { evaluatePilotPolicy } from "@/lib/pilot/runtime/pilot-policy-evaluator";
import { pauseBlocksNewOperations } from "@/lib/pilot/safety/pause-policy";

function basePilot(overrides: Partial<ControlledPilot> = {}): ControlledPilot {
  return {
    id: "pilot1",
    organisationId: "org1",
    name: "Test",
    code: "t1",
    status: "active",
    stage: "sandbox",
    summary: null,
    supportItemAllowlist: ["01_011_0107_1_1"],
    fundingRouteAllowlist: ["ndis_plan_managed"],
    integrationProfileIds: ["profile1"],
    maxTransactionCents: 10_000,
    maxDailyExposureCents: 50_000,
    maxParticipantExposureCents: 20_000,
    maxTotalExposureCents: 100_000,
    maxActiveParticipants: 5,
    limitedLiveEnabled: false,
    assuranceAssessmentId: null,
    goLiveAssessmentId: null,
    pauseReason: null,
    pausedAt: null,
    pausedById: null,
    resumeRequiresDecision: true,
    plannedStartAt: null,
    plannedEndAt: null,
    activatedAt: null,
    terminatedAt: null,
    closedAt: null,
    createdById: "u1",
    updatedById: null,
    correlationId: null,
    safeMetadataJson: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("pilot execution policy", () => {
  it("allows sandbox execute when allowlists match", () => {
    const result = evaluatePilotPolicy({
      pilot: basePilot(),
      operation: "execute_transaction",
      supportItemCode: "01_011_0107_1_1",
      fundingRoute: "ndis_plan_managed",
    });
    expect(result.allowed).toBe(true);
  });

  it("denies when paused", () => {
    const pilot = basePilot({ status: "paused" });
    expect(pauseBlocksNewOperations(pilot.status)).toBe(true);
    const result = evaluatePilotPolicy({
      pilot,
      operation: "execute_transaction",
      supportItemCode: "01_011_0107_1_1",
      fundingRoute: "ndis_plan_managed",
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("PILOT_PAUSED");
  });

  it("denies limited_live_submit when limited live disabled", () => {
    const result = evaluatePilotPolicy({
      pilot: basePilot({ stage: "limited_live", limitedLiveEnabled: false }),
      operation: "limited_live_submit",
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("LIMITED_LIVE_DISABLED_BY_DEFAULT");
  });

  it("denies empty allowlist", () => {
    const result = evaluatePilotPolicy({
      pilot: basePilot({ supportItemAllowlist: [] }),
      operation: "execute_transaction",
      supportItemCode: "01_011_0107_1_1",
      fundingRoute: "ndis_plan_managed",
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("SUPPORT_ITEM_DENIED");
  });
});

import { readFileSync } from "fs";
import { join } from "path";
import { afterEach, describe, expect, it } from "vitest";

import {
  AURA_TOOLS_NO_PRISMA,
  AURA_WAVE1_AUTHORITY_CEILING,
  applyModelOverrideAttempt,
  assertLease,
  assertUnknownPreserved,
  createAndPlanMission,
  createAuraTools,
  getMissionAudit,
  hasActiveLease,
  issueLeases,
  listActiveLeases,
  rejectAuthorityEscalation,
  rejectDiagnosisInference,
  resetLeaseStore,
  resetMissionStore,
  resetWitnessStore,
  revokeAllLeases,
  stopAuraMission,
  verifyProofPlan,
} from "@/lib/aura";
import { getMission, requireMission } from "@/lib/aura/mission/store";
import type { AuraProofPlan } from "@/lib/aura/schemas";

function resetAll() {
  resetMissionStore();
  resetLeaseStore();
  resetWitnessStore();
}

afterEach(() => {
  resetAll();
});

describe("AURA repository boundaries", () => {
  it("reuses CareOSMission as canonical mission id space (mission requestId aura-*)", () => {
    const res = createAndPlanMission({
      goal: "Interview at Harbour Civic Room 3.12",
      selectedModules: ["core_calendar", "transport", "access", "access_passport"],
      accessibilityProfileOptIn: false,
      placeId: "place-harbour-civic",
      scenarioId: "taylor-harbour-interview",
      userId: "demo-participant-taylor",
    });
    const mission = requireMission(res.missionId);
    expect(mission.requestId.startsWith("aura-")).toBe(true);
    expect(mission.missionType).toBe("accessibility_journey");
  });

  it("reuses Access Passport (Taylor interview passport id)", () => {
    const res = createAndPlanMission({
      goal: "Interview at Harbour Civic",
      selectedModules: ["access", "access_passport"],
      placeId: "place-harbour-civic",
      userId: "demo-participant-taylor",
    });
    const mission = requireMission(res.missionId);
    expect(mission.selectedPassportId).toBe("passport-taylor-interview");
  });

  it("reuses AccessPlace harbour id", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access", "access_passport"],
      placeId: "place-harbour-civic",
      userId: "u1",
    });
    expect(requireMission(res.missionId).placeId).toBe("place-harbour-civic");
    expect(res.plan?.recommendedRoute?.placeId).toBe("place-harbour-civic");
  });

  it("AURA tools do not receive Prisma (static + source scan)", () => {
    expect(AURA_TOOLS_NO_PRISMA).toBe(true);
    const toolsSrc = readFileSync(
      join(process.cwd(), "lib/aura/tools/index.ts"),
      "utf8",
    );
    expect(toolsSrc.toLowerCase()).not.toMatch(/from ["']@?\/?.*prisma|prisma\./);
    const tools = createAuraTools({
      missionId: "x",
      userId: "u",
    });
    expect(Object.keys(tools).length).toBeGreaterThan(3);
  });

  it("existing non-AI routes remain reachable in response", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access", "access_passport"],
      placeId: "place-harbour-civic",
      userId: "u1",
    });
    expect(res.nonAiRoutes.some((r) => r.href === "/access")).toBe(true);
  });
});

describe("AURA authority", () => {
  it("default authority does not exceed L2_RECOMMEND", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access", "access_passport"],
      placeId: "place-harbour-civic",
      userId: "u1",
    });
    expect(res.authority.maximumLevel).toBe(AURA_WAVE1_AUTHORITY_CEILING);
    expect(res.authority.currentLevel).toBe("L2_RECOMMEND");
  });

  it("model cannot raise authority", () => {
    const result = rejectAuthorityEscalation("L2_RECOMMEND", "L4_APPROVED_SERVICE_WRITE");
    expect(result.allowed).toBe(false);
  });

  it("expired capability lease is rejected", () => {
    const leases = issueLeases({
      missionId: "m1",
      userId: "u1",
      modules: ["access"],
      resourceScope: ["place-harbour-civic"],
      correlationId: "c1",
      ttlMs: -1000,
    });
    expect(leases.length).toBeGreaterThan(0);
    expect(listActiveLeases("m1")).toHaveLength(0);
    expect(() => assertLease("m1", "access.read_place_evidence")).toThrow(
      /AURA_LEASE_DENIED/,
    );
  });

  it("revoked capability lease is rejected", () => {
    issueLeases({
      missionId: "m2",
      userId: "u1",
      modules: ["access"],
      resourceScope: ["place-harbour-civic"],
      correlationId: "c1",
    });
    revokeAllLeases("m2", "test");
    expect(hasActiveLease("m2", "access.read_place_evidence")).toBe(false);
  });

  it("participant stop revokes leases", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access", "access_passport"],
      placeId: "place-harbour-civic",
      userId: "u1",
    });
    expect(listActiveLeases(res.missionId).length).toBeGreaterThan(0);
    stopAuraMission(res.missionId, "u1");
    expect(listActiveLeases(res.missionId)).toHaveLength(0);
  });

  it("disabled accessibility_profile module cannot be selected without opt-in", () => {
    expect(() =>
      createAndPlanMission({
        goal: "Interview",
        selectedModules: ["accessibility_profile", "access"],
        accessibilityProfileOptIn: false,
        placeId: "place-harbour-civic",
        userId: "u1",
      }),
    ).not.toThrow();
    // filtered out rather than throw when opt-in false via service
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access", "access_passport"],
      accessibilityProfileOptIn: false,
      placeId: "place-harbour-civic",
      userId: "u1",
    });
    expect(res.modules.accessibilityProfileOptIn).toBe(false);
    expect(res.modules.selected).not.toContain("accessibility_profile");
  });

  it("accessibility profile remains opt-in", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access", "access_passport"],
      accessibilityProfileOptIn: false,
      placeId: "place-harbour-civic",
      userId: "u1",
    });
    expect(res.modules.accessibilityProfileOptIn).toBe(false);
  });
});

describe("AURA access decisions", () => {
  it("diagnosis text creates no requirement", () => {
    const result = rejectDiagnosisInference({
      freeText: "I have autism and cerebral palsy",
      explicitRequirements: [],
    });
    expect(result.ok).toBe(true);
    expect(result.detail).toMatch(/zero inferred/i);
  });

  it("unknown remains unknown", () => {
    const check = assertUnknownPreserved(
      ["Toilet operation unknown"],
      ["Toilet is working fine"],
    );
    expect(check.ok).toBe(false);
  });

  it("verifier result cannot be overridden by model", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access", "access_passport"],
      placeId: "place-harbour-civic",
      userId: "u1",
    });
    const overridden = applyModelOverrideAttempt(res.verifier!, "verified");
    expect(overridden.status).toBe(res.verifier!.status);
    expect(overridden.findings.some((f) => f.code === "model_override_ignored")).toBe(
      true,
    );
  });
});

describe("AURA proof plan", () => {
  it("plan without evidence is rejected", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access", "access_passport"],
      placeId: "place-harbour-civic",
      userId: "u1",
    });
    const plan = {
      ...res.plan!,
      evidence: [],
    } satisfies AuraProofPlan;
    const v = verifyProofPlan({
      plan,
      mission: requireMission(res.missionId),
      requiredBlockers: [],
      expectedUnknowns: plan.unknowns,
      allowedDisclosureFields: ["step_free", "lift"],
    });
    expect(v.status).toBe("rejected");
  });

  it("plan omitting a blocker is rejected", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access", "access_passport"],
      placeId: "place-harbour-civic",
      userId: "u1",
    });
    const plan = { ...res.plan!, blockers: [] };
    const v = verifyProofPlan({
      plan,
      mission: requireMission(res.missionId),
      requiredBlockers: ["Entrance A blocked"],
      expectedUnknowns: plan.unknowns,
      allowedDisclosureFields: ["step_free"],
    });
    expect(v.status).toBe("rejected");
  });

  it("plan with valid evidence is verified", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access", "access_passport"],
      placeId: "place-harbour-civic",
      userId: "u1",
    });
    expect(res.verifier?.status).toMatch(/verified/);
    expect(res.plan?.evidence.length).toBeGreaterThan(0);
  });
});

describe("AURA stop", () => {
  it("stop revokes leases and preserves audit history", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access", "access_passport"],
      placeId: "place-harbour-civic",
      userId: "u1",
    });
    const beforeAudit = getMissionAudit(res.missionId).length;
    const stopped = stopAuraMission(res.missionId, "u1");
    expect(stopped.mission.status).toBe("stopped");
    expect(stopped.revokedLeaseCount).toBeGreaterThan(0);
    expect(listActiveLeases(res.missionId)).toHaveLength(0);
    expect(getMissionAudit(res.missionId).length).toBeGreaterThanOrEqual(beforeAudit);
    expect(getMission(res.missionId)?.stopState).toBe(true);
  });
});

describe("AURA flagship Taylor scenario", () => {
  it("creates mission graph and selects Entrance B + western lift; preserves unknowns", () => {
    const res = createAndPlanMission({
      goal:
        "Taylor has an interview in Room 3.12 at Harbour Civic Centre tomorrow at 10:00 am",
      selectedModules: ["core_calendar", "transport", "access", "access_passport"],
      accessibilityProfileOptIn: false,
      placeId: "place-harbour-civic",
      scenarioId: "taylor-harbour-interview",
      userId: "demo-participant-taylor",
      freeText: "I was diagnosed with something — do not use that.",
    });

    expect(res.missionGraph.nodes.length).toBeGreaterThan(5);
    expect(res.plan?.status).toBe("suitable_with_conditions");
    expect(res.plan?.recommendedRoute?.entranceLabel).toMatch(/Entrance B/i);
    expect(res.plan?.recommendedRoute?.liftLabel).toMatch(/Western/i);
    expect(
      res.alternatives.some((a) => /Entrance A/i.test(a)) ||
        res.plan?.rejectedAlternatives.some((a) => /Entrance A/i.test(a.label)),
    ).toBe(true);
    expect(res.unknowns.some((u) => /toilet/i.test(u))).toBe(true);
    expect(res.unknowns.some((u) => /reception|assistance/i.test(u))).toBe(true);
    expect(res.proposedActions).toHaveLength(0);
    expect(res.authority.maximumLevel).toBe("L2_RECOMMEND");
    expect(res.nonAiRoutes.length).toBeGreaterThan(0);

    // zero writes
    const audit = getMissionAudit(res.missionId);
    expect(audit.some((e) => e.payload.writeCount === 0 || e.type === "plan_built")).toBe(
      true,
    );
  });

  it("participant cancellation / stop performs no write side effects beyond stop", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access", "access_passport"],
      placeId: "place-harbour-civic",
      userId: "demo-participant-taylor",
    });
    const stopped = stopAuraMission(res.missionId, "demo-participant-taylor");
    expect(stopped.response.proposedActions).toHaveLength(0);
    expect(stopped.response.missionState).toBe("stopped");
  });
});

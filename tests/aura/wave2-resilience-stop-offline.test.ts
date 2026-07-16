import { afterEach, describe, expect, it } from "vitest";

import {
  assessPlanResilience,
  createAndPlanMission,
  createAuraTools,
  createOfflineVisitPack,
  deleteOfflinePack,
  discardIfStopped,
  getOfflinePack,
  getOrCreateAbortController,
  getStopReceipt,
  listActiveLeases,
  listCounterfactuals,
  renderOfflinePackHtml,
  requireMission,
  resetChallengeStore,
  resetCounterfactualStore,
  resetLeaseStore,
  resetMissionStore,
  resetOfflinePackStore,
  resetStopRegistry,
  resetWitnessStore,
  runBoundedPlanChallenge,
  runCounterfactual,
  stopAuraMission,
  tamperWitnessLastHash,
  verifyMissionAudit,
  getMissionAuditReplay,
} from "@/lib/aura";

function resetAll() {
  resetMissionStore();
  resetLeaseStore();
  resetWitnessStore();
  resetCounterfactualStore();
  resetChallengeStore();
  resetOfflinePackStore();
  resetStopRegistry();
}

afterEach(() => {
  resetAll();
});

function taylorMission() {
  const res = createAndPlanMission({
    goal: "Attend interview Room 3.12 at 10:00",
    selectedModules: [
      "access",
      "access_passport",
      "transport",
      "core_calendar",
    ],
    placeId: "place-harbour-civic",
    scenarioId: "taylor-harbour-interview",
    userId: "demo-participant-taylor",
  });
  const mission = requireMission(res.missionId);
  return { res, mission };
}

describe("AURA Wave 2 — counterfactual engine", () => {
  it("western lift outage invalidates preferred route and labels simulated", () => {
    const { mission } = taylorMission();
    const basePlanId = mission.plan!.id;
    const result = runCounterfactual(
      {
        missionId: mission.id,
        basePlanId,
        mutation: {
          category: "environment",
          operation: "set_unavailable",
          simulated: true,
          label: "Western lift also stops working",
          targetId: "hcc-lift-west",
        },
      },
      mission.participantId,
    );
    expect(result.simulated).toBe(true);
    expect(result.disclaimer).toMatch(/No real venue/);
    expect(result.before.routeId).toBeTruthy();
    expect(result.after.routeId).toBeUndefined();
    expect(result.after.status).toBe("blocked");
    expect(result.changeSummary.routeChanged).toBe(true);
    expect(requireMission(mission.id).plan!.id).toBe(basePlanId);
  });

  it("evening visit closes Entrance B route", () => {
    const { mission } = taylorMission();
    const result = runCounterfactual(
      {
        missionId: mission.id,
        basePlanId: mission.plan!.id,
        mutation: {
          category: "time",
          operation: "set_time",
          simulated: true,
          label: "Interview at 7:00 pm",
          value: "2026-07-16T09:00:00.000Z",
        },
      },
      mission.participantId,
    );
    expect(result.after.routeId).toBeUndefined();
    expect(result.changeSummary.lostAlternatives.length).toBeGreaterThan(0);
  });

  it("confirming toilet present resolves unknown without mutating base plan", () => {
    const { mission } = taylorMission();
    const baseUnknowns = [...mission.unknowns];
    const result = runCounterfactual(
      {
        missionId: mission.id,
        basePlanId: mission.plan!.id,
        mutation: {
          category: "evidence",
          operation: "confirm_present",
          simulated: true,
          label: "Venue confirms toilet is operating",
          featureType: "accessible_toilet",
        },
      },
      mission.participantId,
    );
    expect(result.changeSummary.resolvedUnknowns.length).toBeGreaterThan(0);
    expect(result.after.unknowns.some((u) => /toilet/i.test(u))).toBe(false);
    expect(requireMission(mission.id).unknowns).toEqual(baseUnknowns);
  });

  it("confirming toilet absence creates a blocker", () => {
    const { mission } = taylorMission();
    const result = runCounterfactual(
      {
        missionId: mission.id,
        basePlanId: mission.plan!.id,
        mutation: {
          category: "evidence",
          operation: "confirm_absent",
          simulated: true,
          label: "Toilet confirmed absent",
          featureType: "accessible_toilet",
        },
      },
      mission.participantId,
    );
    expect(result.after.status).toBe("blocked");
    expect(result.changeSummary.newlyBlocked.length).toBeGreaterThan(0);
  });

  it("rejects hard-requirement weakening and unsupported mutations", () => {
    const { mission } = taylorMission();
    expect(() =>
      runCounterfactual(
        {
          missionId: mission.id,
          basePlanId: mission.plan!.id,
          mutation: {
            category: "environment",
            operation: "set_unavailable",
            featureType: "step_free",
            simulated: true,
            label: "Weaken step_free passport requirement",
          },
        },
        mission.participantId,
      ),
    ).toThrow(/HARD_REQUIREMENT|AURA_CF/);

    expect(() =>
      runCounterfactual(
        {
          missionId: mission.id,
          basePlanId: mission.plan!.id,
          mutation: {
            category: "communication",
            operation: "set_unavailable",
            simulated: true,
            label: "Unsupported combo",
          },
        },
        mission.participantId,
      ),
    ).toThrow(/UNSUPPORTED/);
  });

  it("denies cross-user counterfactual", () => {
    const { mission } = taylorMission();
    expect(() =>
      runCounterfactual(
        {
          missionId: mission.id,
          basePlanId: mission.plan!.id,
          mutation: {
            category: "environment",
            operation: "set_unavailable",
            simulated: true,
            label: "Western lift outage",
          },
        },
        "other-user",
      ),
    ).toThrow(/FORBIDDEN/);
  });

  it("stop prevents new counterfactuals", () => {
    const { mission } = taylorMission();
    stopAuraMission(mission.id, mission.participantId);
    expect(() =>
      runCounterfactual(
        {
          missionId: mission.id,
          basePlanId: mission.plan!.id,
          mutation: {
            category: "environment",
            operation: "set_unavailable",
            simulated: true,
            label: "Western lift outage",
          },
        },
        mission.participantId,
      ),
    ).toThrow(/STOPPED/);
  });
});

describe("AURA Wave 2 — resilience", () => {
  it("identifies western lift SPOF and does not score the participant", () => {
    const { mission } = taylorMission();
    const assessment = assessPlanResilience(mission.id);
    expect(assessment.singlePointsOfFailure.some((s) => /lift/i.test(s))).toBe(
      true,
    );
    expect(assessment.level).toMatch(/moderate|low|no_verified_fallback/);
    expect(assessment.note).toMatch(/not participant capability/i);
    expect(assessment.verifiedFallbacks).toEqual([]);
    expect(assessment.unverifiedFallbacks.length).toBeGreaterThan(0);
  });
});

describe("AURA Wave 2 — bounded plan challenge", () => {
  it("runs required checks without chain-of-thought and enforces one cycle", () => {
    const { mission } = taylorMission();
    const first = runBoundedPlanChallenge(mission.id);
    expect(first.checks.length).toBeGreaterThanOrEqual(9);
    expect(first.chainOfThought).toBeUndefined();
    expect(first.nonAiAlternativeAvailable).toBe(true);
    expect(JSON.stringify(first)).not.toMatch(/chainOfThought|hidden.?reason/i);

    const second = runBoundedPlanChallenge(mission.id);
    expect(second.generatedAt).toBe(first.generatedAt);
  });
});

describe("AURA Wave 2 — stop protocol", () => {
  it("revokes leases, is idempotent, preserves plan and audit, returns receipt", () => {
    const { mission } = taylorMission();
    getOrCreateAbortController(mission.id);
    expect(listActiveLeases(mission.id).length).toBeGreaterThan(0);
    const witnessBefore = verifyMissionAudit(mission.id).eventCount;

    const a = stopAuraMission(mission.id, mission.participantId);
    expect(a.receipt.result).toBe("stopped");
    expect(a.receipt.revokedCapabilityLeaseIds.length).toBeGreaterThan(0);
    expect(JSON.stringify(a.receipt)).not.toMatch(
      /diagnosis|passport-|health/i,
    );
    expect(listActiveLeases(mission.id).length).toBe(0);
    expect(requireMission(mission.id).plan).toBeTruthy();
    expect(requireMission(mission.id).status).toBe("stopped");

    const b = stopAuraMission(mission.id, mission.participantId);
    expect(b.receipt.id).toBe(a.receipt.id);
    expect(getStopReceipt(mission.id)?.id).toBe(a.receipt.id);

    const verify = verifyMissionAudit(mission.id);
    expect(verify.valid).toBe(true);
    expect(verify.eventCount).toBeGreaterThan(witnessBefore);
  });

  it("discards late results after stop", () => {
    const { mission } = taylorMission();
    stopAuraMission(mission.id, mission.participantId);
    const late = discardIfStopped(mission.id, { plan: "should-not-apply" });
    expect(late).toEqual({ discarded: true, reason: "mission_stopped" });
  });

  it("denies cross-user stop", () => {
    const { mission } = taylorMission();
    expect(() => stopAuraMission(mission.id, "intruder")).toThrow(/FORBIDDEN/);
  });
});

describe("AURA Wave 2 — audit replay", () => {
  it("verifies hash chain and fails when tampered", () => {
    const { mission } = taylorMission();
    runCounterfactual(
      {
        missionId: mission.id,
        basePlanId: mission.plan!.id,
        mutation: {
          category: "environment",
          operation: "set_unavailable",
          simulated: true,
          label: "Western lift also stops working",
        },
      },
      mission.participantId,
    );
    const ok = verifyMissionAudit(mission.id);
    expect(ok.valid).toBe(true);

    const manifest = getMissionAuditReplay(mission.id);
    expect(manifest.events.length).toBeGreaterThan(0);
    expect(
      manifest.events.every(
        (e) =>
          !("chainOfThought" in e) &&
          (e as { hiddenReasoning?: unknown }).hiddenReasoning === undefined,
      ),
    ).toBe(true);
    expect(manifest.note).toMatch(/No hidden chain-of-thought/i);

    tamperWitnessLastHash(mission.id);
    const bad = verifyMissionAudit(mission.id);
    expect(bad.valid).toBe(false);
    expect(bad.firstInvalidSequence).toBeDefined();
  });

  it("stopped mission replay includes stop event", () => {
    const { mission } = taylorMission();
    stopAuraMission(mission.id, mission.participantId);
    const manifest = getMissionAuditReplay(mission.id);
    expect(manifest.events.some((e) => e.type === "mission.stopped")).toBe(
      true,
    );
  });
});

describe("AURA Wave 2 — offline Visit Pack", () => {
  it("creates data-minimised pack with route, unknowns, evidence dates, HTML without JS", () => {
    const { mission } = taylorMission();
    const pack = createOfflineVisitPack({
      missionId: mission.id,
      userId: mission.participantId,
    });
    expect(pack.route?.orderedInstructions.length).toBeGreaterThan(0);
    expect(pack.unknowns.length).toBeGreaterThan(0);
    expect(pack.evidenceDates.length).toBeGreaterThan(0);
    expect(pack.generatedAt).toBeTruthy();
    expect(pack.excludedByDefault).toContain("diagnosis");
    expect(JSON.stringify(pack)).not.toMatch(/diagnosis:|"ICD|NDIS plan/i);

    const html = renderOfflinePackHtml(pack);
    expect(html).toContain("<h1>");
    expect(html).toContain("<ol>");
    expect(html).not.toMatch(/<script/i);
    expect(html).toMatch(/saved snapshot/i);

    deleteOfflinePack({
      missionId: mission.id,
      packId: pack.id,
      userId: mission.participantId,
    });
    expect(getOfflinePack(pack.id)).toBeNull();
  });

  it("labels pack mission_stopped after Stop AURA", () => {
    const { mission } = taylorMission();
    const pack = createOfflineVisitPack({
      missionId: mission.id,
      userId: mission.participantId,
    });
    stopAuraMission(mission.id, mission.participantId);
    const after = getOfflinePack(pack.id);
    expect(after?.status).toBe("mission_stopped");
  });
});

describe("AURA Wave 2 — AI boundaries", () => {
  it("tools remain Prisma-free and cannot continue counterfactuals after stop", async () => {
    const { mission } = taylorMission();
    const tools = createAuraTools({
      missionId: mission.id,
      userId: mission.participantId,
    });
    expect(tools.runCounterfactual).toBeDefined();
    expect(tools.assessPlanResilience).toBeDefined();
    expect(tools.createOfflineVisitPack).toBeDefined();
    expect(tools.readAuditReplay).toBeDefined();

    stopAuraMission(mission.id, mission.participantId);
    await expect(
      tools.runCounterfactual.execute({
        basePlanId: mission.plan!.id,
        mutation: {
          category: "environment",
          operation: "set_unavailable",
          simulated: true as const,
          label: "Western lift outage",
        },
      }),
    ).rejects.toThrow(/STOPPED/);
  });

  it("lists counterfactuals without mutating state", () => {
    const { mission } = taylorMission();
    expect(listCounterfactuals(mission.id)).toEqual([]);
  });
});

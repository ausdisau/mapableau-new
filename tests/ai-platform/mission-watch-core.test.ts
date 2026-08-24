import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearMissionPlanStore,
  planMission,
} from "@/lib/ai/platform/missions";
import {
  clearMissionWatchStore,
  createMissionWatch,
  disableOptionalWatch,
  FORBIDDEN_WATCH_TYPES,
  markConsentRevokedForParticipant,
  MISSION_WATCH_TYPES,
  NOTIFICATION_BOUNDARY,
  tickMissionWatches,
  watchMayCreateOperationalAction,
  zonedLocalToUtc,
  DEFAULT_MISSION_TIMEZONE,
  listWatches,
  listActiveAlerts,
} from "@/lib/ai/platform/mission-watch";
import { clearRecoveryStore, getMissionEvents } from "@/lib/ai/platform/recovery";

function enableFlags() {
  process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED = "true";
  process.env.MAPABLE_MISSION_WATCH_ENABLED = "true";
  process.env.MAPABLE_ADAPTIVE_RECOVERY_ENABLED = "true";
}

function clearFlags() {
  delete process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED;
  delete process.env.MAPABLE_MISSION_WATCH_ENABLED;
  delete process.env.MAPABLE_ADAPTIVE_RECOVERY_ENABLED;
  delete process.env.MAPABLE_MISSION_WATCH_KILL_SWITCH;
  delete process.env.MAPABLE_PROACTIVE_AI_KILL_SWITCH;
  delete process.env.MAPABLE_PROACTIVE_PLANNING_ENABLED;
}

function planFor(participantId: string, objective = "Interview with transport") {
  return planMission({
    actorId: participantId,
    participantId,
    objective,
    requestedUseOfAccessibilityProfile: false,
    plainLanguage: true,
    consentScopes: ["profile.read"],
    source: "participant_text",
  });
}

describe("Mission Watch", () => {
  beforeEach(() => {
    clearMissionPlanStore();
    clearMissionWatchStore();
    clearRecoveryStore();
    enableFlags();
  });
  afterEach(() => {
    clearFlags();
    clearMissionPlanStore();
    clearMissionWatchStore();
    clearRecoveryStore();
  });

  it("fires deadline trigger in warning window", () => {
    const plan = planFor("p1");
    const ref = new Date("2026-08-24T12:00:00.000Z");
    const deadline = new Date(ref.getTime() + 60 * 60_000).toISOString();
    createMissionWatch({
      missionId: plan.missionId,
      createdBy: "p1",
      watchType: "deadline",
      condition: { deadlineIso: deadline, warnBeforeMinutes: 120 },
      timeZone: DEFAULT_MISSION_TIMEZONE,
    });
    const tick = tickMissionWatches({
      missionId: plan.missionId,
      participantId: "p1",
      referenceTime: ref,
    });
    expect(tick.fired.some((f) => f.watchType === "deadline")).toBe(true);
    expect(tick.alertsCreated.length).toBeGreaterThan(0);
    expect(tick.operationalActionsCreated).toBe(0);
  });

  it("suppresses duplicate alerts for unchanged conditions", () => {
    const plan = planFor("p1");
    const ref = new Date("2026-08-24T12:00:00.000Z");
    const deadline = new Date(ref.getTime() + 30 * 60_000).toISOString();
    createMissionWatch({
      missionId: plan.missionId,
      createdBy: "p1",
      watchType: "deadline",
      condition: { deadlineIso: deadline, warnBeforeMinutes: 120 },
    });
    const first = tickMissionWatches({
      missionId: plan.missionId,
      participantId: "p1",
      referenceTime: ref,
    });
    expect(first.fired.length).toBe(1);
    const second = tickMissionWatches({
      missionId: plan.missionId,
      participantId: "p1",
      referenceTime: new Date(ref.getTime() + 5 * 60_000),
    });
    expect(second.fired.length).toBe(0);
    expect(second.suppressed.some((s) => s.suppressReason === "duplicate_unchanged_condition")).toBe(true);
  });

  it("detects stale evidence", () => {
    const plan = planFor("p1");
    const ref = new Date("2026-08-24T12:00:00.000Z");
    createMissionWatch({
      missionId: plan.missionId,
      createdBy: "p1",
      watchType: "evidence_freshness",
      condition: {
        evidenceObservedAt: new Date(ref.getTime() - 3 * 24 * 60 * 60_000).toISOString(),
        evidenceMaxAgeMinutes: 24 * 60,
      },
    });
    const tick = tickMissionWatches({
      missionId: plan.missionId,
      participantId: "p1",
      referenceTime: ref,
    });
    expect(tick.fired.some((f) => f.watchType === "evidence_freshness")).toBe(true);
  });

  it("flags unconfirmed transport / departure readiness", () => {
    const plan = planFor("p1");
    const ref = new Date("2026-08-24T12:00:00.000Z");
    const departure = new Date(ref.getTime() + 45 * 60_000).toISOString();
    createMissionWatch({
      missionId: plan.missionId,
      createdBy: "p1",
      watchType: "departure_readiness",
      condition: {
        deadlineIso: departure,
        transportConfirmed: false,
        warnBeforeMinutes: 90,
      },
      optional: true,
    });
    const tick = tickMissionWatches({
      missionId: plan.missionId,
      participantId: "p1",
      referenceTime: ref,
    });
    expect(tick.fired.some((f) => f.watchType === "departure_readiness")).toBe(true);
    expect(tick.fired[0]?.recoveryEventType).toBe("TRANSPORT_UNAVAILABLE");
  });

  it("detects expiring approval", () => {
    const plan = planFor("p1");
    const ref = new Date("2026-08-24T12:00:00.000Z");
    const expires = new Date(ref.getTime() + 20 * 60_000).toISOString();
    createMissionWatch({
      missionId: plan.missionId,
      createdBy: "p1",
      watchType: "approval_expiry",
      condition: { approvalExpiresAt: expires, warnBeforeMinutes: 60 },
    });
    const tick = tickMissionWatches({
      missionId: plan.missionId,
      participantId: "p1",
      referenceTime: ref,
    });
    expect(tick.fired.some((f) => f.watchType === "approval_expiry")).toBe(true);
  });

  it("allows participant to disable optional watch", () => {
    const plan = planFor("p1");
    const watch = createMissionWatch({
      missionId: plan.missionId,
      createdBy: "p1",
      watchType: "participant_requested_reminder",
      triggerAt: new Date(Date.now() + 60_000).toISOString(),
      optional: true,
    });
    expect(watch.optional).toBe(true);
    const disabled = disableOptionalWatch({
      missionId: plan.missionId,
      watchId: watch.watchId,
    });
    expect(disabled.enabled).toBe(false);
    const tick = tickMissionWatches({
      missionId: plan.missionId,
      participantId: "p1",
    });
    expect(tick.watchesEvaluated).toBe(0);
  });

  it("AI kill switch leaves deterministic watch operating", () => {
    process.env.MAPABLE_PROACTIVE_AI_KILL_SWITCH = "true";
    process.env.MAPABLE_PROACTIVE_PLANNING_ENABLED = "true";
    const plan = planFor("p1");
    const ref = new Date("2026-08-24T12:00:00.000Z");
    createMissionWatch({
      missionId: plan.missionId,
      createdBy: "p1",
      watchType: "deadline",
      condition: {
        deadlineIso: new Date(ref.getTime() + 30 * 60_000).toISOString(),
        warnBeforeMinutes: 120,
      },
    });
    const tick = tickMissionWatches({
      missionId: plan.missionId,
      participantId: "p1",
      referenceTime: ref,
    });
    expect(tick.aiAssistUsed).toBe(false);
    expect(tick.fired.length).toBe(1);
  });

  it("watch does not execute operational action", () => {
    expect(watchMayCreateOperationalAction()).toBe(false);
    expect(NOTIFICATION_BOUNDARY.emailAllowed).toBe(false);
    expect(NOTIFICATION_BOUNDARY.smsAllowed).toBe(false);
    const plan = planFor("p1");
    const ref = new Date("2026-08-24T12:00:00.000Z");
    createMissionWatch({
      missionId: plan.missionId,
      createdBy: "p1",
      watchType: "service_confirmation",
      condition: { serviceConfirmed: false },
    });
    const tick = tickMissionWatches({
      missionId: plan.missionId,
      participantId: "p1",
      referenceTime: ref,
    });
    expect(tick.operationalActionsCreated).toBe(0);
    for (const alert of tick.alertsCreated) {
      expect(alert.externalNotificationSent).toBe(false);
    }
    for (const result of tick.fired) {
      expect(result.operationalActionCreated).toBe(false);
    }
  });

  it("watch respects revoked consent", () => {
    const plan = planFor("p1");
    const ref = new Date("2026-08-24T12:00:00.000Z");
    createMissionWatch({
      missionId: plan.missionId,
      createdBy: "p1",
      watchType: "evidence_freshness",
      condition: {
        evidenceObservedAt: new Date(ref.getTime() - 10 * 24 * 60 * 60_000).toISOString(),
        evidenceMaxAgeMinutes: 60,
        requiredConsentScopes: ["profile.read"],
      },
    });
    markConsentRevokedForParticipant("p1", "profile.read");
    const tick = tickMissionWatches({
      missionId: plan.missionId,
      participantId: "p1",
      actorConsentScopes: [],
      referenceTime: ref,
    });
    expect(tick.fired.length).toBe(0);
    expect(tick.suppressed.some((s) => s.suppressReason === "consent_revoked")).toBe(true);
  });

  it("unrelated mission is unaffected", () => {
    const planA = planFor("pA", "Interview A");
    const planB = planFor("pB", "Interview B");
    const ref = new Date("2026-08-24T12:00:00.000Z");
    createMissionWatch({
      missionId: planA.missionId,
      createdBy: "pA",
      watchType: "deadline",
      condition: {
        deadlineIso: new Date(ref.getTime() + 30 * 60_000).toISOString(),
        warnBeforeMinutes: 120,
      },
    });
    const tickB = tickMissionWatches({
      missionId: planB.missionId,
      participantId: "pB",
      referenceTime: ref,
    });
    expect(tickB.watchesEvaluated).toBe(0);
    expect(tickB.alertsCreated.length).toBe(0);
    expect(listWatches(planB.missionId).length).toBe(0);
    expect(listActiveAlerts(planB.missionId).length).toBe(0);
    expect(getMissionEvents(planB.missionId).length).toBe(0);
  });

  it("timezone correctness for Australia/Sydney", () => {
    const utc = zonedLocalToUtc({
      year: 2026, month: 8, day: 24, hour: 14, minute: 0, timeZone: "Australia/Sydney",
    });
    expect(utc.toISOString()).toBe("2026-08-24T04:00:00.000Z");

    const plan = planFor("p1");
    const deadlineLocalAsUtc = zonedLocalToUtc({
      year: 2026, month: 8, day: 24, hour: 15, minute: 0, timeZone: "Australia/Sydney",
    });
    const ref = zonedLocalToUtc({
      year: 2026, month: 8, day: 24, hour: 14, minute: 0, timeZone: "Australia/Sydney",
    });
    createMissionWatch({
      missionId: plan.missionId,
      createdBy: "p1",
      watchType: "deadline",
      timeZone: "Australia/Sydney",
      condition: {
        deadlineIso: deadlineLocalAsUtc.toISOString(),
        warnBeforeMinutes: 120,
      },
    });
    const tick = tickMissionWatches({
      missionId: plan.missionId,
      participantId: "p1",
      referenceTime: ref,
    });
    expect(tick.fired.some((f) => f.explanation.includes("Australia/Sydney"))).toBe(true);
  });

  it("has no clinical monitoring category", () => {
    for (const forbidden of FORBIDDEN_WATCH_TYPES) {
      expect((MISSION_WATCH_TYPES as readonly string[]).includes(forbidden)).toBe(false);
    }
    expect(MISSION_WATCH_TYPES).not.toContain("clinical_monitoring");
  });
});

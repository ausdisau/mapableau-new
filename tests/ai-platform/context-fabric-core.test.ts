import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assertInferenceCannotMasquerade,
  clearContextFabricStore,
  evaluateFreshness,
  evaluateSourceGate,
  formatContextForParticipant,
  isParticipantReported,
  isVerifiedEvidence,
  preserveProvenanceFields,
  publishDomainEvent,
  queryMissionContext,
  saveContextRecord,
  verificationForSourceTrust,
} from "@/lib/ai/platform/context-fabric";
import type { MapAbleContextRecord } from "@/lib/ai/platform/context-fabric";
import { clearMissionPlanStore, planMission } from "@/lib/ai/platform/missions";
import { clearRecoveryStore, getMissionEvents } from "@/lib/ai/platform/recovery";

function baseEvent(overrides: Record<string, unknown> = {}) {
  return {
    eventType: "access.observation_changed" as const,
    domain: "access" as const,
    aggregateType: "venue",
    aggregateId: "venue-1",
    tenantId: "tenant-a",
    producer: "authenticated_internal" as const,
    schemaVersion: 1,
    evidenceRefs: ["ev-1"],
    dataClasses: ["operational" as const],
    consentScopes: [] as string[],
    subjectRefs: [{ kind: "participant" as const, id: "p1" }],
    missionIds: [] as string[],
    payload: { summary: "Lift working" },
    traceId: "trace-1",
    sourceTrust: "verified_system_record" as const,
    sourceRef: "obs-1",
    sourceAuthority: "access-graph",
    authenticated: true,
    ...overrides,
  };
}

describe("Context Fabric core", () => {
  beforeEach(() => {
    clearContextFabricStore();
    clearMissionPlanStore();
    clearRecoveryStore();
    process.env.MAPABLE_CONTEXT_FABRIC_ENABLED = "true";
    process.env.MAPABLE_CONTEXT_EVENT_ROUTING_ENABLED = "true";
    process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED = "true";
    process.env.MAPABLE_ADAPTIVE_RECOVERY_ENABLED = "true";
    delete process.env.MAPABLE_CONTEXT_FABRIC_KILL_SWITCH;
    delete process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH;
  });

  afterEach(() => {
    clearContextFabricStore();
    clearMissionPlanStore();
    clearRecoveryStore();
    delete process.env.MAPABLE_CONTEXT_FABRIC_ENABLED;
    delete process.env.MAPABLE_CONTEXT_EVENT_ROUTING_ENABLED;
    delete process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED;
    delete process.env.MAPABLE_ADAPTIVE_RECOVERY_ENABLED;
  });

  it("retains provenance fields on publish", () => {
    const result = publishDomainEvent(baseEvent());
    expect(result.error).toBeNull();
    expect(result.record).toBeTruthy();
    expect(result.record!.sourceType).toBe("verified_system_record");
    const prov = preserveProvenanceFields(result.record!);
    expect(prov.sourceType).toBe("verified_system_record");
    expect(prov.sourceRef).toBe("obs-1");
    expect(prov.sourceAuthority).toBe("access-graph");
    expect(prov.evidenceRefs).toContain("ev-1");
    expect(prov.traceId).toBe("trace-1");
  });

  it("keeps model inference as inference_only — never verified", () => {
    const gate = evaluateSourceGate({
      sourceType: "model_inference",
      sourceRef: "model-1",
      sourceAuthority: "mission-assist",
      producer: "model_assist",
      dataClasses: ["operational"],
      consentScopes: [],
      tenantId: "tenant-a",
      authenticated: true,
    });
    expect(gate.allowed).toBe(true);
    expect(gate.effectiveVerification).toBe("inference_only");
    expect(
      assertInferenceCannotMasquerade("model_inference", "verified").ok,
    ).toBe(false);
    expect(verificationForSourceTrust("model_inference")).toBe("inference_only");

    const published = publishDomainEvent(
      baseEvent({
        eventType: "feature.state_changed",
        domain: "platform",
        producer: "model_assist",
        sourceTrust: "model_inference",
        sourceRef: "inf-1",
        sourceAuthority: "model",
        contextType: "feature_state",
      }),
    );
    expect(published.record?.verificationStatus).toBe("inference_only");
    expect(published.record?.sourceType).toBe("model_inference");
  });

  it("excludes unauthorised context from query", () => {
    publishDomainEvent(
      baseEvent({
        consentScopes: ["access_profile"],
        dataClasses: ["participant_pii"],
        missionIds: ["m1"],
        subjectRefs: [{ kind: "participant", id: "p1" }],
      }),
    );
    const denied = queryMissionContext({
      missionId: "m1",
      participantId: "p1",
      tenantId: "tenant-a",
      consentScopes: [],
      actor: { actorId: "p1", role: "participant", tenantId: "tenant-a" },
    });
    expect(denied.records).toHaveLength(0);
    expect(denied.excludedCount).toBeGreaterThan(0);
  });

  it("revoked consent removes future access and redacts payload", () => {
    const first = publishDomainEvent(
      baseEvent({
        consentScopes: ["access_profile"],
        dataClasses: ["participant_pii"],
        missionIds: ["m1"],
        payload: { summary: "sensitive preference" },
      }),
    );
    expect(first.record?.payload.summary).toBe("sensitive preference");

    publishDomainEvent(
      baseEvent({
        eventType: "consent.revoked",
        domain: "platform",
        consentScopes: ["access_profile"],
        subjectRefs: [{ kind: "participant", id: "p1" }],
        payload: { participantId: "p1", scope: "access_profile" },
        sourceTrust: "participant_declared",
        producer: "participant",
        authenticated: true,
      }),
    );

    const after = queryMissionContext({
      missionId: "m1",
      participantId: "p1",
      tenantId: "tenant-a",
      consentScopes: ["access_profile"],
      actor: { actorId: "p1", role: "participant", tenantId: "tenant-a" },
    });
    expect(after.records).toHaveLength(0);
  });

  it("event duplicates are idempotent", () => {
    const a = publishDomainEvent(baseEvent({ idempotencyKey: "idem-1" }));
    const b = publishDomainEvent(baseEvent({ idempotencyKey: "idem-1" }));
    expect(a.duplicate).toBe(false);
    expect(b.duplicate).toBe(true);
  });

  it("irrelevant mission does not receive routed recovery event", () => {
    process.env.MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED = "true";
    const planA = planMission({
      actorId: "p1",
      participantId: "p1",
      objective: "Interview tomorrow — wheelchair accessible transport",
      requestedUseOfAccessibilityProfile: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
    });
    const planB = planMission({
      actorId: "p1",
      participantId: "p1",
      objective: "Book care support for Friday",
      requestedUseOfAccessibilityProfile: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
    });

    publishDomainEvent(
      baseEvent({
        eventType: "transport.unavailable",
        domain: "transport",
        missionIds: [planA.missionId],
        sourceTrust: "verified_system_record",
        sourceRef: "trip-9",
        producer: "authenticated_internal",
        authenticated: true,
      }),
    );

    expect(getMissionEvents(planA.missionId).length).toBeGreaterThan(0);
    expect(getMissionEvents(planB.missionId)).toHaveLength(0);
  });

  it("marks stale evidence correctly and distinguishes unknown from missing", () => {
    const staleStatus = evaluateFreshness({
      contextType: "service_outage",
      observedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    });
    expect(staleStatus === "stale" || staleStatus === "expired").toBe(true);

    const unknownStatus = evaluateFreshness({
      contextType: "access_observation",
      observedAt: "not-a-date",
    });
    expect(unknownStatus).toBe("unknown");

    const record: MapAbleContextRecord = {
      contextId: "c-unknown",
      contextType: "access_observation",
      subjectRefs: [{ kind: "participant", id: "p1" }],
      domain: "access",
      tenantId: "tenant-a",
      sourceType: "verified_system_record",
      sourceRef: "x",
      sourceAuthority: "access",
      observedAt: "not-a-date",
      receivedAt: new Date().toISOString(),
      freshnessStatus: "unknown",
      verificationStatus: "verified",
      evidenceRefs: [],
      dataClasses: ["operational"],
      consentScopes: [],
      payload: {},
      traceId: "t",
      missionIds: ["m1"],
    };
    saveContextRecord(record);

    const result = queryMissionContext({
      missionId: "m1",
      participantId: "p1",
      tenantId: "tenant-a",
      requestedContextTypes: ["access_observation", "calendar_event"],
      consentScopes: [],
      actor: { actorId: "p1", role: "participant", tenantId: "tenant-a" },
    });
    expect(result.unknownTypes).toContain("access_observation");
    expect(result.missingTypes).toContain("calendar_event");
    expect(result.unknownTypes).not.toContain("calendar_event");
  });

  it("participant-reported is not verified", () => {
    expect(isParticipantReported("participant_declared")).toBe(true);
    expect(isVerifiedEvidence("participant_declared")).toBe(false);
    const published = publishDomainEvent(
      baseEvent({
        producer: "participant",
        sourceTrust: "participant_declared",
        sourceAuthority: "participant",
        sourceRef: "pref-1",
        eventType: "goal.changed",
        domain: "mission",
        contextType: "participant_goal",
      }),
    );
    expect(published.record?.sourceType).toBe("participant_declared");
    expect(published.record?.verificationStatus).not.toBe("verified");
  });

  it("prevents cross-tenant leakage", () => {
    publishDomainEvent(
      baseEvent({
        tenantId: "tenant-a",
        missionIds: ["m1"],
        subjectRefs: [{ kind: "participant", id: "p1" }],
      }),
    );
    const leaked = queryMissionContext({
      missionId: "m1",
      participantId: "p1",
      tenantId: "tenant-b",
      consentScopes: [],
      actor: { actorId: "p1", role: "participant", tenantId: "tenant-b" },
    });
    expect(leaked.records).toHaveLength(0);
  });

  it("global AI kill switch does not break deterministic context", () => {
    process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH = "true";
    process.env.MAPABLE_AI_PLATFORM_ENABLED = "false";
    const result = publishDomainEvent(baseEvent({ missionIds: ["m1"] }));
    expect(result.error).toBeNull();
    expect(result.record).not.toBeNull();
    const q = queryMissionContext({
      missionId: "m1",
      participantId: "p1",
      tenantId: "tenant-a",
      consentScopes: [],
      actor: { actorId: "p1", role: "participant", tenantId: "tenant-a" },
    });
    expect(q.fabricEnabled).toBe(true);
    expect(q.records.length).toBeGreaterThan(0);
    delete process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH;
  });

  it("selective routing skips recovery when mission not linked", () => {
    const published = publishDomainEvent(
      baseEvent({
        eventType: "transport.unavailable",
        domain: "transport",
        missionIds: [],
      }),
    );
    expect(published.route.targets).not.toContain("recovery_engine");
  });

  it("accessible provenance display includes source date verification why and correction", () => {
    const published = publishDomainEvent(baseEvent({ missionIds: ["m1"] }));
    const view = formatContextForParticipant(published.record!);
    expect(view.sourceLabel.length).toBeGreaterThan(0);
    expect(view.observedAt).toBeTruthy();
    expect(view.verificationState).toBeTruthy();
    expect(view.whyUsed.length).toBeGreaterThan(0);
    expect(view.correctionRoute).toContain("/my-mapable/");
    expect(view.ariaLabel).toContain(view.sourceLabel);
  });

  it("source gate rejects model masquerading as verified system record", () => {
    const gate = evaluateSourceGate({
      sourceType: "verified_system_record",
      sourceRef: "x",
      sourceAuthority: "model",
      producer: "model_assist",
      dataClasses: ["operational"],
      consentScopes: [],
      tenantId: "tenant-a",
      authenticated: true,
    });
    expect(gate.allowed).toBe(false);
  });
});

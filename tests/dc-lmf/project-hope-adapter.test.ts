import { describe, expect, it } from "vitest";

import { buildProjectHopeSyntheticContext } from "@/lib/dc-lmf/adapters/project-hope";

const baseRecord = {
  id: "mem-1",
  category: "access" as const,
  payload: { communication: "eye_gaze_aac" },
  payloadRef: null,
  sourceType: "self_report" as const,
  sourceRef: null,
  confidence: "authoritative" as const,
  scope: "service" as const,
  dataClass: "person_private" as const,
  evidenceRefs: [],
  observedAt: "2026-09-20T08:00:00.000Z",
  validFrom: null,
  validUntil: null,
  supersedesId: null,
  status: "active" as const,
};

describe("Project Hope DC-LMF adapter", () => {
  it("accepts fictional synthetic context and keeps authority bounded", () => {
    const context = buildProjectHopeSyntheticContext({
      dataOrigin: "fictional_synthetic",
      fictionalPatient: true,
      scenarioId: "maya-icu-001",
      participantId: "synthetic-maya",
      records: [baseRecord],
    });

    expect(context.access).toHaveLength(1);
    expect(context.authority).toBe("context_only");
    expect(context.mayAlterClinicalState).toBe(false);
    expect(context.mayCreateConsent).toBe(false);
    expect(context.mayInferCapacity).toBe(false);
  });

  it("rejects operational/real-person input", () => {
    expect(() =>
      buildProjectHopeSyntheticContext({
        dataOrigin: "operational" as "fictional_synthetic",
        fictionalPatient: true,
        scenarioId: "bad",
        participantId: "real-person",
        records: [baseRecord],
      }),
    ).toThrow();
  });
});

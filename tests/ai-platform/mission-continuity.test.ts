import { describe, expect, it } from "vitest";

import {
  analyseMissionContinuity,
  buildMissionGraph,
} from "@/lib/ai/platform/missions";

describe("Mission continuity", () => {
  it("flags missing transport for interview graph", () => {
    const graph = buildMissionGraph({
      objective: "Job interview tomorrow at 10am with wheelchair transport",
      domains: ["core", "jobs", "transport", "access", "care"],
      profileUsed: false,
      profileConsentRequested: false,
      profileConsentGranted: false,
    });
    const alerts = analyseMissionContinuity(graph);
    expect(alerts.some((a) => a.code === "TRANSPORT_UNCONFIRMED")).toBe(true);
    expect(alerts.some((a) => a.code === "ACCESS_EVIDENCE_MISSING")).toBe(true);
  });

  it("preserves not_authorised distinct from missing", () => {
    const graph = buildMissionGraph({
      objective: "Need care",
      domains: ["core", "care"],
      profileUsed: false,
      profileConsentRequested: false,
      profileConsentGranted: false,
    });
    graph.nodes.push({
      id: "restricted",
      type: "care_support",
      label: "Restricted care record",
      status: "not_authorised",
      sourceDomain: "care",
      recordId: null,
      details: "Actor lacks authority",
      evidenceRefs: [],
      confidence: null,
      limitations: [],
    });
    const alerts = analyseMissionContinuity(graph);
    expect(alerts.some((a) => a.code === "NOT_AUTHORISED")).toBe(true);
    expect(graph.nodes.find((n) => n.id === "restricted")?.status).toBe(
      "not_authorised",
    );
  });

  it("flags consent_required for profile without consent", () => {
    const graph = buildMissionGraph({
      objective: "Transport help",
      domains: ["core", "transport"],
      profileUsed: false,
      profileConsentRequested: true,
      profileConsentGranted: false,
    });
    expect(graph.nodes.some((n) => n.status === "consent_required")).toBe(true);
    const alerts = analyseMissionContinuity(graph);
    expect(alerts.some((a) => a.code === "CONSENT_REQUIRED")).toBe(true);
  });
});

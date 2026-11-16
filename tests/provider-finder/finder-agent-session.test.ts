import { describe, expect, it } from "vitest";

import {
  appendProviderFinderTurn,
  priorAppliedFromSession,
  resetProviderFinderSessionsForTests,
} from "@/lib/ai/agent-sessions/provider-finder-session";
import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";

const stored: AppliedSearchFields = {
  query: "morning daily activities",
  location: "Penrith 2750",
  providerName: "",
  serviceQuery: "morning daily activities",
  accessQuery: "text communication",
  supportType: "personal-care",
  accessNeedIds: ["text-communication"],
};

describe("priorAppliedFromSession", () => {
  it("lets an empty form location clear a stored location", () => {
    resetProviderFinderSessionsForTests();
    appendProviderFinderTurn("finder-test", {
      userText: "morning daily activities around Penrith",
      assistantText: "I’ll look for providers.",
      applied: stored,
      interpretation: {
        sourceQuery: "morning daily activities around Penrith",
        parsed: true,
        configured: true,
        filters: {
          q: "morning daily activities",
          location: "Penrith 2750",
          access: "text communication",
          service: "morning daily activities",
          provider: "",
        },
        serviceCategorySlug: null,
        serviceCategoryId: null,
        accessNeedIds: ["text-communication"],
        accessNeeds: {
          ids: ["text-communication"],
          confidence: 0.8,
          source: "keyword",
        },
        confidence: 0.8,
        engineId: "test",
      },
      agent: { sessionId: "finder-test", turnIndex: 1, status: "complete" },
    });

    const overlay = priorAppliedFromSession("finder-test", {
      query: stored.query,
      location: "",
      providerName: "",
      serviceQuery: stored.serviceQuery,
      accessQuery: stored.accessQuery,
    });

    expect(overlay?.location).toBe("");
    expect(overlay?.serviceQuery).toBe("morning daily activities");
    expect(overlay?.accessQuery).toBe("text communication");
    resetProviderFinderSessionsForTests();
  });

  it("falls back to the store when no form session is sent", () => {
    resetProviderFinderSessionsForTests();
    appendProviderFinderTurn("finder-test", {
      userText: "help",
      assistantText: "ok",
      applied: stored,
      interpretation: {
        sourceQuery: "help",
        parsed: true,
        configured: true,
        filters: {
          q: "help",
          location: "Penrith 2750",
          access: "",
          service: "",
          provider: "",
        },
        serviceCategorySlug: null,
        serviceCategoryId: null,
        accessNeedIds: [],
        accessNeeds: { ids: [], confidence: 0, source: "none" },
        confidence: 0.4,
        engineId: "test",
      },
      agent: { sessionId: "finder-test", turnIndex: 1, status: "complete" },
    });

    expect(priorAppliedFromSession("finder-test")?.location).toBe("Penrith 2750");
    resetProviderFinderSessionsForTests();
  });
});

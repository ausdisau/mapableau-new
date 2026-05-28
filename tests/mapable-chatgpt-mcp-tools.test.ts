import { describe, expect, it, vi } from "vitest";

import {
  handleAssessNeeds,
  handleCopilotPlan,
  handleGetCapabilities,
  handlePlanCareShift,
  handleSearchWorkers,
} from "@/lib/mcp/handlers";
import { buildDeepLinks } from "@/lib/mcp/deep-links";
import { formatToolResult } from "@/lib/mcp/tool-results";

vi.mock("@/lib/copilot/intentRouter", () => ({
  classifyIntent: vi.fn(() => ({
    type: "support",
    confidence: 0.9,
    reason: "test",
    filters: {},
  })),
}));

vi.mock("@/lib/copilot/contextBuilder", () => ({
  buildCopilotContext: vi.fn(async () => ({
    participantId: "participant-demo-001",
    careBookingId: null,
    orgId: null,
    hasActiveCareBooking: false,
    hasActiveTransportBooking: false,
    recentMessages: [],
  })),
}));

vi.mock("@/lib/copilot/actionPlanner", () => ({
  planCopilotActions: vi.fn(async () => ({
    summary: "Plan to search workers",
    plainLanguageAnswer: "I can help you find workers.",
    filters: {},
    actions: [
      {
        type: "SEARCH_WORKERS",
        label: "Search workers",
        requiresConfirmation: false,
      },
    ],
    draftRecords: [],
    warnings: [],
    requiredConfirmations: [],
  })),
}));

vi.mock("@/lib/copilot/guardrails", () => ({
  applyGuardrails: vi.fn(async ({ planned }: { planned: { summary: string } }) => ({
    ...planned,
    blockedActions: [],
  })),
}));

vi.mock("@/lib/participant-needs/build-needs-snapshot", () => ({
  buildParticipantNeedsSnapshot: vi.fn(async () => null),
}));

vi.mock("@/lib/search/worker-search-stream-service", () => ({
  runWorkerSearchStream: vi.fn(async () => ({
    filters: { query: "support worker" },
    candidates: [
      {
        kind: "worker" as const,
        workerId: "w1",
        displayName: "Alex Worker",
        score: 0.92,
        reasons: ["Skills match"],
      },
    ],
  })),
}));

vi.mock("@/lib/participant-needs/needs-assessment-stream-service", () => ({
  runNeedsAssessmentStream: vi.fn(async () => ({
    summary: "Assessment complete — daily living support recommended.",
    recommendations: [],
    suggestedActions: [],
    draftRecords: [],
    snapshot: { gaps: [], signals: [] },
  })),
}));

vi.mock("@/lib/care/shift-creator/shift-creator-stream-service", () => ({
  runShiftCreatorStream: vi.fn(async () => ({
    draft: {
      careBookingId: "booking-1",
      bookingTitle: "Morning support",
      blocks: [],
    },
    warnings: [],
    suggestedActions: [],
    ambiguousBookings: [],
  })),
}));

vi.mock("@/lib/mcp/resolve-mcp-actor", () => ({
  resolveMcpParticipantId: vi.fn((id?: string) => id ?? "participant-demo-001"),
  resolveMcpProviderActor: vi.fn(async () => ({
    id: "provider-demo",
    email: "provider@demo.local",
    name: "Demo Provider",
    phone: null,
    timezone: "Australia/Sydney",
    locale: "en-AU",
    primaryRole: "provider_admin",
    roles: ["provider_admin"],
  })),
}));

function parseToolJson(result: ReturnType<typeof formatToolResult>) {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

describe("mapable chatgpt mcp tools", () => {
  it("returns capabilities with governance and deep links", async () => {
    const result = await handleGetCapabilities();
    const body = parseToolJson(result);
    const rules = body.governance as string[] | string;
    const rulesText = Array.isArray(rules) ? rules.join(" ") : String(rules);
    expect(rulesText).toContain("No writes");
    expect((body.tools as string[]).length).toBe(5);
    expect((body.deepLinks as { askUrl: string }).askUrl).toContain("/ask");
  });

  it("plans copilot actions from query", async () => {
    const result = await handleCopilotPlan({ query: "find a support worker" });
    const body = parseToolJson(result);
    expect(body.intent).toBe("support");
    expect((body.actions as unknown[]).length).toBeGreaterThan(0);
    expect((body.deepLinks as { workerSearchUrl: string }).workerSearchUrl).toBeTruthy();
  });

  it("aggregates worker search stream", async () => {
    const result = await handleSearchWorkers({
      query: "support worker with manual handling",
    });
    const body = parseToolJson(result);
    const candidates = body.candidates as { displayName: string }[];
    expect(candidates).toHaveLength(1);
    expect(candidates[0].displayName).toBe("Alex Worker");
  });

  it("aggregates needs assessment stream", async () => {
    const result = await handleAssessNeeds({
      query: "participant needs daily living support",
    });
    const body = parseToolJson(result);
    expect(String(body.summary)).toContain("Assessment complete");
  });

  it("aggregates shift creator stream", async () => {
    const result = await handlePlanCareShift({
      query: "morning shift next Tuesday",
    });
    const body = parseToolJson(result);
    const draft = body.draft as { bookingTitle: string };
    expect(draft.bookingTitle).toBe("Morning support");
    expect((body.deepLinks as { shiftCreatorUrl: string }).shiftCreatorUrl).toContain(
      "shift-creator",
    );
  });

  it("formatToolResult includes widget metadata", () => {
    const links = buildDeepLinks();
    const formatted = formatToolResult({
      summary: "Test",
      deepLinks: links,
      data: { ok: true },
      widgetState: {
        summary: "Test",
        primaryUrl: links.askUrl,
      },
    });
    expect(formatted._meta?.["openai/outputTemplate"]).toBe(
      "ui://mapable/result-card",
    );
    const parsed = parseToolJson(formatted);
    expect(parsed.summary).toBe("Test");
  });
});

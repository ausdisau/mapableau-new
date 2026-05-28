import { describe, expect, it, vi, beforeEach } from "vitest";

import { POST } from "@/app/api/prms/participants/[id]/needs/assess/stream/route";

const mockUser = { id: "user-1", primaryRole: "participant" as const };

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: vi.fn(async () => mockUser),
}));

vi.mock("@/lib/participant-needs/assert-participant-access", () => ({
  assertParticipantAccess: vi.fn(),
  ParticipantAccessError: class ParticipantAccessError extends Error {},
}));

vi.mock("@/lib/participant-needs/needs-assessment-stream-service", () => ({
  runNeedsAssessmentStream: vi.fn(async ({ onEvent }) => {
    await onEvent?.({
      stage: "received_query",
      message: "Starting your needs assessment.",
    });
    return {
      participantId: "participant-demo-001",
      summary: "Test summary",
      snapshot: {
        participantId: "participant-demo-001",
        participantUserId: "participant-demo-001",
        displayName: "Alex",
        serviceRegion: null,
        signals: [],
        gaps: [],
        profileCompletionPercent: 80,
        profileCompletionHints: [],
      },
      recommendations: [],
      suggestedActions: [],
      draftRecords: [],
    };
  }),
}));

describe("POST /api/prms/participants/[id]/needs/assess/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns text/event-stream", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ query: "assess my needs" }),
      }),
      { params: Promise.resolve({ id: "participant-demo-001" }) },
    );

    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    const text = await response.text();
    expect(text).toContain("event: progress");
    expect(text).toContain("event: result");
  });
});

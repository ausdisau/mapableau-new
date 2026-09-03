import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/mapable/ask/route";
import { requireApiSession } from "@/lib/api/auth-handler";
import { getOptionalApiUser } from "@/lib/api/optional-session";
import { assertCanAccessParticipantData } from "@/lib/prms/participant-access";

vi.mock("@/lib/api/optional-session", () => ({
  getOptionalApiUser: vi.fn(),
}));

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: vi.fn(),
}));

vi.mock("@/lib/prms/participant-access", () => ({
  assertCanAccessParticipantData: vi.fn(async () => undefined),
  ParticipantAccessError: class ParticipantAccessError extends Error {},
}));

vi.mock("@/lib/ai/agent-ops/agent-run-service", () => ({
  createAgentRun: vi.fn(async () => ({ id: "run-ask-1", skipped: false })),
}));

vi.mock("@/lib/copilot/contextBuilder", () => ({
  buildCopilotContext: vi.fn(async () => null),
}));

vi.mock("@/lib/bookings/rag/copilot-route", () => ({
  shouldRouteToBookingAgent: vi.fn(() => false),
}));

describe("POST /api/mapable/ask Ask MapAble", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated default asks", async () => {
    vi.mocked(getOptionalApiUser).mockResolvedValue(null);
    vi.mocked(requireApiSession).mockResolvedValue(
      Response.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const res = await POST(
      new Request("http://localhost/api/mapable/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "Find accessible places" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects empty and oversized payloads", async () => {
    vi.mocked(getOptionalApiUser).mockResolvedValue({
      id: "user-1",
    } as Awaited<ReturnType<typeof getOptionalApiUser>>);

    const empty = await POST(
      new Request("http://localhost/api/mapable/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "   " }),
      }),
    );
    expect(empty.status).toBe(400);

    const huge = await POST(
      new Request("http://localhost/api/mapable/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "x".repeat(2001) }),
      }),
    );
    expect(huge.status).toBe(400);
  });

  it("returns Ask MapAble meta and preserves hard constraints for places", async () => {
    vi.mocked(getOptionalApiUser).mockResolvedValue({
      id: "user-1",
    } as Awaited<ReturnType<typeof getOptionalApiUser>>);
    vi.mocked(assertCanAccessParticipantData).mockResolvedValue(undefined);

    const res = await POST(
      new Request("http://localhost/api/mapable/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query:
            "Find a place with step-free entrance and accessible toilet and power-wheelchair access",
          mode: "Places",
          pageContext: { pathname: "/access", mapableModule: "access" },
          sessionId: "ask-test-1",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.askMeta?.brand).toBe("Ask MapAble");
    expect(body.answer.toLowerCase()).toMatch(/hard|requirement|unknown/);
    expect(body.actions.some((a: { type: string }) => a.type === "SAFETY_ESCALATION")).toBe(
      true,
    );
  });

  it("records human help pathway", async () => {
    vi.mocked(getOptionalApiUser).mockResolvedValue({
      id: "user-1",
    } as Awaited<ReturnType<typeof getOptionalApiUser>>);

    const res = await POST(
      new Request("http://localhost/api/mapable/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "I want to talk to a person",
          sessionId: "ask-test-human",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.askMeta?.brand).toBe("Ask MapAble");
    expect(body.answer.toLowerCase()).toMatch(/person|contact|safety/);
  });
});

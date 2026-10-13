import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: vi.fn(async () => ({ id: "user-1" })),
}));

vi.mock("@/lib/search/worker-search-stream-service", () => ({
  runWorkerSearchStream: vi.fn(async ({ onEvent }) => {
    await onEvent?.({
      stage: "received_query",
      message: "Received your worker search request.",
    });
    return {
      filters: { query: "support worker" },
      candidates: [
        {
          id: "worker-1",
          kind: "worker",
          displayName: "Demo Worker",
          serviceTypes: ["personal care"],
          serviceRegions: ["sydney"],
          languages: ["english"],
          verificationStatus: "verified",
          summary: "Demo summary",
          score: 40,
        },
      ],
    };
  }),
}));

import { POST } from "@/app/api/search/workers/stream/route";

describe("POST /api/search/workers/stream", () => {
  it("streams progress and final result events", async () => {
    const response = await POST(
      new Request("http://localhost/api/search/workers/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "support worker" }),
      }),
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("event: progress");
    expect(text).toContain("event: result");
    expect(text).toContain("Demo Worker");
  });

  it("returns 400 when query is empty", async () => {
    const response = await POST(
      new Request("http://localhost/api/search/workers/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: " " }),
      }),
    );
    expect(response.status).toBe(400);
  });
});

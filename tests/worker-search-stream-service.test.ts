import { beforeEach, describe, expect, it, vi } from "vitest";

import { runWorkerSearchStream } from "@/lib/search/worker-search-stream-service";

vi.mock("@/lib/search/provider-search-service", () => ({
  searchWorkerMarketplaceCandidates: vi.fn(),
}));

import { searchWorkerMarketplaceCandidates } from "@/lib/search/provider-search-service";

describe("runWorkerSearchStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits progress stages in order and returns ranked blended results", async () => {
    vi.mocked(searchWorkerMarketplaceCandidates).mockResolvedValue([
      {
        id: "worker-1",
        kind: "worker",
        displayName: "Arabic Personal Care Worker",
        serviceTypes: ["personal care"],
        serviceRegions: ["parramatta"],
        languages: ["arabic"],
        verificationStatus: "verified",
        summary: "Experienced with complex support needs",
      },
      {
        id: "provider-1",
        kind: "provider",
        displayName: "Parramatta Support Hub",
        serviceTypes: ["support_coordination"],
        serviceRegions: ["parramatta"],
        languages: [],
        verificationStatus: "pending_review",
        summary: "Local support coordination team",
      },
    ]);

    const events: string[] = [];
    const result = await runWorkerSearchStream({
      query: "Need personal care in parramatta with arabic support",
      onEvent: (event) => {
        events.push(event.stage);
      },
    });

    expect(events).toEqual([
      "received_query",
      "parsed_filters",
      "fetched_workers",
      "fetched_providers",
      "ranking_candidates",
      "finalized_results",
    ]);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0].kind).toBe("worker");
    expect(result.candidates[0].score).toBeGreaterThan(result.candidates[1].score ?? 0);
  });
});

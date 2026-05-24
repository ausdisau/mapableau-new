import { describe, expect, it } from "vitest";

import { applyHardFilters } from "@/lib/matching/hard-filters";
import { rankSupportWorkers } from "@/lib/matching/support-worker-matching";
import { detectSegmentConflicts, buildDefaultSegments } from "@/lib/orchestration/care-transport-bundle-orchestrator";

describe("matching hard filters", () => {
  it("blocks participant-blocked workers", () => {
    const r = applyHardFilters({ isBlocked: true });
    expect(r.passed).toBe(false);
  });
});

describe("support worker ranking", () => {
  it("ranks verified workers higher", () => {
    const ranked = rankSupportWorkers([
      { id: "a", verificationStatus: "verified", available: true },
      { id: "b", verificationStatus: "pending_review", available: true },
    ]);
    expect(ranked[0]?.entityId).toBe("a");
  });
});

describe("bundle orchestrator", () => {
  it("builds five segments", () => {
    const segments = buildDefaultSegments(new Date("2026-06-01T08:00:00Z"));
    expect(segments).toHaveLength(5);
  });

  it("detects timing conflicts when buffers are violated", () => {
    const segments = buildDefaultSegments(new Date("2026-06-01T08:00:00Z"));
    segments[1]!.scheduledStart = segments[0]!.scheduledEnd!;
    const conflicts = detectSegmentConflicts(segments);
    expect(conflicts.length).toBeGreaterThan(0);
  });
});

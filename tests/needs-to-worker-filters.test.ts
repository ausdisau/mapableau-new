import { describe, expect, it } from "vitest";

import { buildParticipantNeedsSnapshot } from "@/lib/participant-needs/build-needs-snapshot";
import { needsSnapshotToWorkerFilters } from "@/lib/participant-needs/needs-to-worker-filters";
import { MOCK_PARTICIPANT_ID } from "@/lib/prms/mockPrmsData";

describe("needsSnapshotToWorkerFilters", () => {
  it("maps mobility signals to wheelchair accessible filter", async () => {
    const snapshot = await buildParticipantNeedsSnapshot(MOCK_PARTICIPANT_ID);
    expect(snapshot).not.toBeNull();

    const filters = needsSnapshotToWorkerFilters(snapshot!);
    expect(filters.wheelchairAccessible).toBe(true);
  });
});

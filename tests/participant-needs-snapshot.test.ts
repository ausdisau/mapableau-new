import { describe, expect, it } from "vitest";

import { buildParticipantNeedsSnapshot } from "@/lib/participant-needs/build-needs-snapshot";
import { MOCK_PARTICIPANT_ID } from "@/lib/prms/mockPrmsData";

describe("buildParticipantNeedsSnapshot", () => {
  it("builds mock participant snapshot with signals and gaps", async () => {
    const snapshot = await buildParticipantNeedsSnapshot(MOCK_PARTICIPANT_ID);

    expect(snapshot).not.toBeNull();
    expect(snapshot!.participantId).toBe(MOCK_PARTICIPANT_ID);
    expect(snapshot!.signals.length).toBeGreaterThan(0);
    expect(snapshot!.profileCompletionPercent).toBeGreaterThan(0);
  });

  it("includes transport gap when query mentions transport without signals", async () => {
    const snapshot = await buildParticipantNeedsSnapshot(
      MOCK_PARTICIPANT_ID,
      "I need wheelchair transport tomorrow",
    );

    expect(snapshot).not.toBeNull();
    const transportGaps = snapshot!.gaps.filter((g) => g.domain === "transport");
    expect(transportGaps.some((g) => g.severity === "urgent")).toBe(true);
  });
});

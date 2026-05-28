import { describe, expect, it } from "vitest";

import { runNeedsAssessmentStream } from "@/lib/participant-needs/needs-assessment-stream-service";
import { MOCK_PARTICIPANT_ID } from "@/lib/prms/mockPrmsData";

describe("runNeedsAssessmentStream", () => {
  it("emits stages in order and returns assessment result", async () => {
    const stages: string[] = [];

    const result = await runNeedsAssessmentStream({
      participantId: MOCK_PARTICIPANT_ID,
      query: "what support do I need",
      onEvent: async (event) => {
        stages.push(event.stage);
      },
    });

    expect(stages[0]).toBe("received_query");
    expect(stages).toContain("loaded_profile");
    expect(stages).toContain("finalized");
    expect(result.summary.length).toBeGreaterThan(10);
    expect(result.snapshot.signals.length).toBeGreaterThan(0);
    expect(result.draftRecords[0]?.type).toBe("NEEDS_ASSESSMENT_SUMMARY");
    expect(result.recommendations.some((r) => r.kind === "worker_search")).toBe(
      true,
    );
  });
});

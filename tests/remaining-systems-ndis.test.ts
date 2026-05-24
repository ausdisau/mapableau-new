import { describe, expect, it } from "vitest";

import { mockNdisAdapter } from "@/lib/ndis/adapters/mock-ndis-adapter";
import { hashPayload } from "@/lib/ndis/ndis-client";
import { getNdisAdapter } from "@/lib/ndis/ndis-client";

describe("NDIS adapter layer", () => {
  it("mock adapter returns stable plan summary shape", async () => {
    const plan = await mockNdisAdapter.getParticipantPlanSummary("p1");
    expect(plan.participantId).toBe("p1");
    expect(plan.planStartDate).toBeDefined();
  });

  it("switches adapter by type", () => {
    expect(getNdisAdapter("mock").type).toBe("mock");
    expect(getNdisAdapter("aggregator").type).toBe("aggregator");
  });

  it("hashes payloads without raw storage", () => {
    const hash = hashPayload({ secret: "value" });
    expect(hash).toHaveLength(64);
  });
});

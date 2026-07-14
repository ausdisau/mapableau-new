import { describe, expect, it } from "vitest";

import { buildPlanAccessibleTransportUrl } from "@/lib/access-markers/plan-accessible-transport";
import type { AccessMarkerSummary } from "@/lib/access-markers/types";

describe("plan accessible transport link", () => {
  it("encodes destination and scores into transport new-trip URL", () => {
    const summary: AccessMarkerSummary = {
      placeId: "place_1",
      name: "Café Aurora",
      category: "cafe_restaurant",
      addressOrSuburb: "Canberra",
      latitude: -35.28,
      longitude: 149.13,
      overallScore: 82,
      confidenceScore: 74,
      ratingCount: 3,
      commentCount: 2,
      lastCheckedAt: null,
      domainScores: {
        mobility: 80,
        toilet: 70,
        parkingDropoff: 60,
        sensory: 75,
        communication: 80,
        staffService: 85,
      },
      latestComments: [],
      activeAlerts: [{ id: "a1", body: "Lift out of service", createdAt: "" }],
      preferredAccessibleEntrance: "Side ramp",
      accessibleDropoffPoint: "Loading zone on Northbourne",
    };

    const url = buildPlanAccessibleTransportUrl(summary);
    expect(url.startsWith("/dashboard/transport/new?")).toBe(true);
    expect(url).toContain("placeId=place_1");
    expect(url).toContain("accessScore=82");
    expect(url).toContain("confidenceScore=74");
    expect(url).toContain("destinationLat=-35.28");
  });
});

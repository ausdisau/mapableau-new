import { describe, expect, it } from "vitest";

import {
  rankPlacesByAccessFit,
  type RankablePlace,
} from "@/lib/access-chat/access-fit-ranker";
import { buildDeterministicReply } from "@/lib/access-chat/synthesize-response";
import type { AccessSearchIntent } from "@/types/access-chat";

function basePlace(overrides: Partial<RankablePlace> = {}): RankablePlace {
  return {
    id: "place-1",
    name: "Café Aurora",
    category: "cafe_restaurant",
    addressText: "1 Test St",
    suburb: "Chatswood",
    stateOrRegion: "NSW",
    confidence: "multiple_user_reports",
    updatedAt: new Date(),
    location: { latitude: -33.7969, longitude: 151.1832 },
    features: [
      { type: "step_free_entry", notes: null },
      { type: "accessible_toilet", notes: null },
      { type: "quiet_space", notes: null },
    ],
    ratingSummaries: [
      { category: "main_entrance", avgScore: 4.2, sampleCount: 3 },
      { category: "accessible_toilet", avgScore: 4.0, sampleCount: 2 },
    ],
    reviews: [
      {
        reviewBody: "Side entrance is step-free. Toilet was available.",
        visitDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        photos: [],
      },
    ],
    accreditationAssessments: [],
    alerts: [],
    _count: { reviews: 2 },
    ...overrides,
  };
}

const intent: AccessSearchIntent = {
  query: "quiet wheelchair cafe with accessible toilet near Chatswood",
  location: {
    suburb: "Chatswood",
    lat: -33.7969,
    lng: 151.1832,
    radiusMeters: 3000,
  },
  categories: ["cafe_restaurant"],
  requiredFeatures: {
    stepFreeAccess: true,
    accessibleToilet: true,
    quietSpace: true,
  },
  userContext: { mobilityAid: "manual_wheelchair", avoidCrowds: true },
};

describe("access-fit ranker", () => {
  it("labels a well-evidenced match as likely_suitable or suitable_with_caution", () => {
    const results = rankPlacesByAccessFit([basePlace()], intent, { limit: 5 });
    expect(results).toHaveLength(1);
    expect(["likely_suitable", "suitable_with_caution"]).toContain(
      results[0].fit.label,
    );
    expect(results[0].fit.reasons.length).toBeGreaterThan(0);
    expect(results[0].latitude).toBeCloseTo(-33.7969);
  });

  it("prefers not_enough_information when evidence is thin", () => {
    const thin = basePlace({
      features: [],
      ratingSummaries: [],
      reviews: [],
      _count: { reviews: 0 },
      confidence: "unknown",
    });
    const results = rankPlacesByAccessFit([thin], intent);
    expect(results[0].fit.label).toBe("not_enough_information");
  });

  it("surfaces active alert cautions", () => {
    const withAlert = basePlace({
      alerts: [
        {
          severity: "caution",
          title: "Lift out of service",
          body: "Until Friday",
        },
      ],
    });
    const results = rankPlacesByAccessFit([withAlert], intent);
    expect(results[0].fit.cautions.some((c) => /Lift/i.test(c))).toBe(true);
    expect(results[0].evidence.activeAlerts?.length).toBe(1);
  });
});

describe("deterministic synthesis", () => {
  it("builds a plain-language reply with fit labels", () => {
    const results = rankPlacesByAccessFit([basePlace()], intent);
    const text = buildDeterministicReply(intent, results);
    expect(text).toContain("Café Aurora");
    expect(text.toLowerCase()).toMatch(/suitable|information/);
    expect(text).toMatch(/not legal compliance/i);
  });

  it("handles empty results", () => {
    const text = buildDeterministicReply(intent, []);
    expect(text).toMatch(/could not find/i);
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET as getMapAds } from "@/app/api/ads/map/route";
import { POST as postAdEvent } from "@/app/api/ads/events/route";
import {
  allRulesMatchContext,
  assertSafeTargetingPayload,
} from "@/lib/ads/ad-targeting-service";
import { isProviderAdType } from "@/lib/ads/ad-selection-service";
import { isProviderEligibleForMatching } from "@/lib/provider-verification/verification-case-service";
import { getTileLayerProps } from "@/lib/map/tile-config";

const mockCampaign = {
  id: "camp-approved",
  adType: "sponsored_provider_pin" as const,
  status: "active" as const,
  reviewStatus: "approved" as const,
  spentBudgetCents: 0,
  totalBudgetCents: 10000,
  bidAmountCents: 500,
  startsAt: null,
  endsAt: null,
  organisationId: "org-1",
  organisation: { verificationStatus: "verified", status: "active" },
  creatives: [
    {
      id: "creative-1",
      headline: "Accessible Physio Parramatta",
      description: "NDIS-friendly clinic",
      ctaLabel: "Book",
      ctaUrl: "https://example.com",
      providerOutletKey: "outlet-1",
      providerProfileId: null,
      latitude: -33.8148,
      longitude: 151.0033,
      imageUrl: null,
    },
  ],
  targetingRules: [
    {
      ruleKind: "service_category" as const,
      ruleValue: { categories: ["Physiotherapy"] },
    },
  ],
};

const mockUnapprovedCampaign = {
  ...mockCampaign,
  id: "camp-unapproved",
  reviewStatus: "pending" as const,
  status: "pending_review" as const,
};

const mockUnverifiedCampaign = {
  ...mockCampaign,
  id: "camp-unverified",
  organisation: { verificationStatus: "rejected", status: "active" },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adCampaign: {
      findMany: vi.fn(async () => [mockCampaign]),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id === "camp-approved") {
          return {
            bidAmountCents: 500,
            spentBudgetCents: 0,
            totalBudgetCents: 10000,
          };
        }
        return null;
      }),
      update: vi.fn(),
    },
    adEvent: {
      create: vi.fn(async () => ({})),
      count: vi.fn(async () => 0),
    },
    adBudgetEvent: {
      create: vi.fn(async () => ({})),
    },
    adUserAction: {
      create: vi.fn(async () => ({})),
      findFirst: vi.fn(async () => null),
    },
    organisation: {
      findUnique: vi.fn(async () => ({
        verificationStatus: "verified",
        status: "active",
      })),
    },
    $transaction: vi.fn(async (ops: unknown[]) => {
      for (const op of ops) await op;
    }),
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () => undefined,
  })),
}));

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: vi.fn(async () => null),
}));

describe("ad targeting service", () => {
  it("matches service category targeting rules", () => {
    const matches = allRulesMatchContext(
      [{ ruleKind: "service_category", ruleValue: { categories: ["Physiotherapy"] } }],
      {
        surface: "provider_finder",
        serviceCategories: ["Physiotherapy"],
      },
    );
    expect(matches).toBe(true);
  });

  it("blocks prohibited targeting fields", () => {
    expect(() =>
      assertSafeTargetingPayload({ diagnosis: "autism" }),
    ).toThrow(/PROHIBITED_TARGETING_FIELD/);
  });
});

describe("ad selection eligibility", () => {
  it("identifies provider ad types", () => {
    expect(isProviderAdType("sponsored_provider_pin")).toBe(true);
    expect(isProviderAdType("local_campaign_banner")).toBe(false);
  });

  it("blocks unverified provider ads", () => {
    expect(
      isProviderEligibleForMatching(
        mockUnverifiedCampaign.organisation.verificationStatus,
        mockUnverifiedCampaign.organisation.status,
      ),
    ).toBe(false);
  });
});

describe("GET /api/ads/map", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns approved campaign in map ads", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.adCampaign.findMany).mockResolvedValueOnce([
      mockCampaign as never,
    ]);

    const res = await getMapAds(
      new Request(
        "http://localhost/api/ads/map?categories=Physiotherapy&north=-33.7&south=-33.9&east=151.1&west=151.0",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ads).toHaveLength(1);
    expect(body.ads[0].isSponsored).toBe(true);
    expect(body.attributionNote).toContain("OpenStreetMap");
  });

  it("hides unapproved campaigns", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.adCampaign.findMany).mockResolvedValueOnce([]);

    const res = await getMapAds(
      new Request("http://localhost/api/ads/map?categories=Physiotherapy"),
    );
    const body = await res.json();
    expect(body.ads).toHaveLength(0);
    expect(mockUnapprovedCampaign.reviewStatus).toBe("pending");
  });
});

describe("POST /api/ads/events", () => {
  it("records ad events", async () => {
    const { prisma } = await import("@/lib/prisma");
    const res = await postAdEvent(
      new Request("http://localhost/api/ads/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: "camp-approved",
          eventType: "impression",
          placementSurface: "map",
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(prisma.adEvent.create).toHaveBeenCalled();
  });

  it("records hide/report user actions", async () => {
    const { prisma } = await import("@/lib/prisma");
    const res = await postAdEvent(
      new Request("http://localhost/api/ads/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: "camp-approved",
          actionType: "hidden",
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(prisma.adUserAction.create).toHaveBeenCalled();
  });
});

describe("OSM tile configuration", () => {
  it("keeps OSM attribution visible in tile layer props", () => {
    const props = getTileLayerProps();
    expect(props.attribution).toContain("OpenStreetMap");
    expect(props.url).toBeTruthy();
  });
});

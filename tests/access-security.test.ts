import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
  accessPlace: {
    count: vi.fn(),
  },
  accessPlaceReport: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  accessContentReport: {
    create: vi.fn(),
  },
  accessModerationQueue: {
    create: vi.fn(),
  },
  accessVenueClaim: {
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  accessPlaceReview: {
    count: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));
vi.mock("@/lib/access-reviews/review-summary-service", () => ({
  recomputePlaceRatingSummaries: vi.fn(),
}));
vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: vi.fn(),
}));
vi.mock("@/lib/access-reviews/review-access-policy", () => ({
  canDeleteReview: vi.fn(),
  canEditReview: vi.fn(() => true),
}));

import {
  ACCESS_PLACE_SUGGESTION_RATE_LIMIT_PER_HOUR,
  assertAccessPlaceSuggestionQuota,
  reportAccessPlace,
} from "@/lib/access-map/access-place-service";
import { createAccessReview } from "@/lib/access-reviews/access-review-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  ACCESS_API_MAX_JSON_BYTES,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import {
  submitVenueClaim,
  VENUE_CLAIM_RATE_LIMIT_PER_HOUR,
} from "@/lib/venue-access/venue-claim-service";
import { PATCH } from "@/app/api/access/reviews/[reviewId]/route";

describe("access write security controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects oversized JSON before parsing", async () => {
    const req = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-length": `${ACCESS_API_MAX_JSON_BYTES + 1}` },
      body: "{}",
    });

    await expect(parseJsonRequestBody(req)).rejects.toThrow("BODY_TOO_LARGE");
  });

  it("enforces a per-user place suggestion quota", async () => {
    mockPrisma.accessPlace.count.mockResolvedValue(
      ACCESS_PLACE_SUGGESTION_RATE_LIMIT_PER_HOUR,
    );

    await expect(assertAccessPlaceSuggestionQuota("user_1")).rejects.toThrow(
      "ACCESS_PLACE_SUGGESTION_RATE_LIMIT",
    );
  });

  it("enforces a per-user venue claim quota inside the write transaction", async () => {
    const tx = {
      accessVenueClaim: {
        count: vi.fn().mockResolvedValue(VENUE_CLAIM_RATE_LIMIT_PER_HOUR),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
    };
    mockPrisma.$transaction.mockImplementation(
      async (callback: (tx: typeof tx) => unknown) => callback(tx),
    );

    await expect(
      submitVenueClaim({ placeId: "place_1", userId: "user_1" }),
    ).rejects.toThrow("VENUE_CLAIM_RATE_LIMIT");
    expect(tx.accessVenueClaim.create).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("keeps place report duplicate checks and writes in one serializable transaction", async () => {
    const tx = {
      accessPlaceReport: {
        findFirst: vi.fn().mockResolvedValue({ id: "report_1" }),
        create: vi.fn(),
      },
      accessContentReport: { create: vi.fn() },
      accessModerationQueue: { create: vi.fn() },
    };
    mockPrisma.$transaction.mockImplementation(
      async (callback: (tx: typeof tx) => unknown) => callback(tx),
    );

    await expect(
      reportAccessPlace({
        placeId: "place_1",
        reporterId: "user_1",
        reason: "spam",
      }),
    ).rejects.toThrow("PLACE_REPORT_ALREADY_SUBMITTED");
    expect(tx.accessPlaceReport.create).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("keeps review duplicate checks and creates in one serializable transaction", async () => {
    const tx = {
      accessPlaceReview: {
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "review_1",
          placeId: "place_1",
          reviewerProfileId: "user_1",
          reviewBody: "Accessible entry and helpful staff.",
          status: "published",
          ratings: [],
        }),
      },
    };
    mockPrisma.$transaction.mockImplementation(
      async (callback: (tx: typeof tx) => unknown) => callback(tx),
    );

    await createAccessReview({
      placeId: "place_1",
      reviewerProfileId: "user_1",
      displayNameMode: "anonymous_public",
      reviewBody: "Accessible entry and helpful staff.",
      ratings: [{ category: "entrance", value: "good" }],
      publish: true,
    });

    expect(tx.accessPlaceReview.create).toHaveBeenCalled();
    expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it("caps review edit JSON bodies", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      id: "user_1",
      name: "Test User",
      email: "test@example.test",
      primaryRole: "participant",
    } as never);
    mockPrisma.accessPlaceReview.findUnique.mockResolvedValue({
      id: "review_1",
      reviewerProfileId: "user_1",
    });

    const req = new Request(
      "https://example.test/api/access/reviews/review_1",
      {
        method: "PATCH",
        headers: { "content-length": `${ACCESS_API_MAX_JSON_BYTES + 1}` },
        body: "{}",
      },
    );
    const res = await PATCH(req, {
      params: Promise.resolve({ reviewId: "review_1" }),
    });

    expect(res.status).toBe(413);
    expect(mockPrisma.accessPlaceReview.update).not.toHaveBeenCalled();
  });
});

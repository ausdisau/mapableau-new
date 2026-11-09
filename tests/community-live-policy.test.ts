import { describe, expect, it } from "vitest";

import {
  canModerateFinding,
  canPublishFinding,
  mayApprovePublicFinding,
  publicFinding,
  validMutationOrigin,
} from "@/lib/community-live/policy";
import {
  createChallengeSchema,
  createFindingSchema,
  moderateFindingSchema,
} from "@/lib/community-live/validation";

const eligible = {
  consentScope: "public",
  moderation: "approved",
  consentWithdrawnAt: null,
  challengeStatus: "published",
};

describe("MapAble Community consent and publication", () => {
  it("never publishes private or review-only consent", () => {
    expect(canPublishFinding(eligible)).toBe(true);
    expect(canPublishFinding({ ...eligible, consentScope: "private" })).toBe(false);
    expect(canPublishFinding({ ...eligible, consentScope: "review" })).toBe(false);
  });

  it("withholds pending, rejected, withdrawn and unpublished records", () => {
    expect(canPublishFinding({ ...eligible, moderation: "pending" })).toBe(false);
    expect(canPublishFinding({ ...eligible, moderation: "rejected" })).toBe(false);
    expect(canPublishFinding({ ...eligible, consentWithdrawnAt: new Date() })).toBe(false);
    expect(canPublishFinding({ ...eligible, challengeStatus: "draft" })).toBe(false);
  });

  it("review-only is visible for moderation, not public approval", () => {
    expect(canModerateFinding("review", null)).toBe(true);
    expect(canModerateFinding("private", null)).toBe(false);
    expect(canModerateFinding("public", new Date())).toBe(false);
    expect(mayApprovePublicFinding("review", "personA", "personB")).toBe(false);
    expect(mayApprovePublicFinding("public", "personA", "personA")).toBe(false);
    expect(mayApprovePublicFinding("public", "personA", "personB")).toBe(true);
  });

  it("sanitises public records by explicit property selection", () => {
    const record = {
      id: "obs1",
      challengeId: "challenge1",
      title: "Door example",
      feature: "Entrance",
      finding: "A manually observed doorway needs further review",
      method: "direct observation",
      observedAt: new Date("2026-11-09T00:00:00Z"),
      evidenceState: "reviewed",
      rating: "unknown",
      createdAt: new Date("2026-11-09T00:00:00Z"),
      authorId: "private-identity",
      reviewerId: "private-reviewer",
      reviewNote: "confidential note",
      latitude: "-33.88",
      contact: "private email",
      evidenceIds: ["private-photo"],
    };
    const publicValue = publicFinding(record);
    expect(publicValue.title).toBe(record.title);
    expect(publicValue).not.toHaveProperty("authorId");
    expect(publicValue).not.toHaveProperty("reviewerId");
    expect(publicValue).not.toHaveProperty("reviewNote");
    expect(publicValue).not.toHaveProperty("contact");
    expect(publicValue).not.toHaveProperty("latitude");
    expect(publicValue).not.toHaveProperty("evidenceIds");
    expect(publicValue.rating).toBe("unknown");
  });
});

describe("MapAble Community request boundaries", () => {
  it("requires exact same-origin browser mutations", () => {
    const url = "https://mapable.com.au/api/community/live/observations";
    expect(validMutationOrigin(new Request(url, {
      headers: { origin: "https://mapable.com.au" },
    }))).toBe(true);
    expect(validMutationOrigin(new Request(url, {
      headers: { origin: "https://another.example" },
    }))).toBe(false);
    expect(validMutationOrigin(new Request(url))).toBe(false);
  });

  it("requires explicit consent and rejects invented moderation fields", () => {
    const input = {
      challengeId: "c1",
      title: "Observation",
      feature: "Entrance",
      finding: "There was a measured obstacle at the entrance",
      method: "measurement",
      observedAt: "2026-11-09",
      consentScope: "private",
      consentAcknowledged: true,
    };
    expect(createFindingSchema.safeParse(input).success).toBe(true);
    expect(createFindingSchema.safeParse({ ...input, consentAcknowledged: false }).success).toBe(false);
    expect(createFindingSchema.safeParse({ ...input, rating: "green" }).success).toBe(false);
    expect(createFindingSchema.safeParse({ ...input, moderation: "approved" }).success).toBe(false);
    expect(createFindingSchema.safeParse({ ...input, observedAt: "2099-01-01" }).success).toBe(false);
  });

  it("rejects unsupported templates, oversized notes and additional review fields", () => {
    expect(createChallengeSchema.safeParse({
      title: "Real path survey", template: "unsupported", boundary: "City centre",
      instruction: "Record the measurable physical access changes",
    }).success).toBe(false);
    expect(moderateFindingSchema.safeParse({
      id: "o1", decision: "approved", note: "x".repeat(401),
    }).success).toBe(false);
    expect(moderateFindingSchema.safeParse({
      id: "o1", decision: "approved", note: "", adminOverride: true,
    }).success).toBe(false);
  });
});

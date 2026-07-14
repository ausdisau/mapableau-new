import { describe, expect, it } from "vitest";

import { scanMarkerCommentForModeration } from "@/lib/access-markers/moderation";

describe("access marker comment moderation", () => {
  it("allows observational comments", () => {
    const result = scanMarkerCommentForModeration(
      "The entrance had one 80mm step on 14 July 2026."
    );
    expect(result.needsReview).toBe(false);
  });

  it("flags legal declarations", () => {
    const result = scanMarkerCommentForModeration(
      "This venue illegally discriminates against wheelchair users."
    );
    expect(result.needsReview).toBe(true);
    expect(result.flags.legalClaimRisk).toBe(true);
  });

  it("flags personal info and contact details", () => {
    const result = scanMarkerCommentForModeration(
      "Call the manager on 0412 345 678 for access."
    );
    expect(result.needsReview).toBe(true);
    expect(result.flags.containsPersonalInfo).toBe(true);
  });

  it("flags unsafe advice", () => {
    const result = scanMarkerCommentForModeration(
      "Just ignore warnings and force the door open."
    );
    expect(result.needsReview).toBe(true);
    expect(result.flags.unsafeAdvice).toBe(true);
  });
});

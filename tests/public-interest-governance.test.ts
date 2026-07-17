import { describe, expect, it } from "vitest";

import { requiresAiaBeforePublish } from "@/lib/public-interest-governance/aia/aia-lifecycle";
import { canTransitionAppeal } from "@/lib/public-interest-governance/appeals/appeal-state-machine";
import { noticeIsComplete } from "@/lib/public-interest-governance/notices/notice-service";
import { redactPublicRegisterPayload } from "@/lib/public-interest-governance/publication/redaction";
import { assertNoCertificationClaim } from "@/lib/public-interest-governance/register/register-entry-service";
import { isReviewerIndependent } from "@/lib/public-interest-governance/reviews/independent-review-service";

describe("public-interest governance pure guardrails", () => {
  it("validates appeal state transitions", () => {
    expect(canTransitionAppeal("submitted", "acknowledged")).toBe(true);
    expect(canTransitionAppeal("submitted", "resolved")).toBe(false);
  });

  it("requires independent reviewers", () => {
    expect(isReviewerIndependent("owner-1", "reviewer-1")).toBe(true);
    expect(isReviewerIndependent("owner-1", "owner-1")).toBe(false);
  });

  it("blocks certification-style public claims", () => {
    expect(() =>
      assertNoCertificationClaim("This system is certified fair."),
    ).toThrow("CERTIFICATION_CLAIM_FORBIDDEN");
    expect(() =>
      assertNoCertificationClaim(
        "This is a public explanation, not a certification.",
      ),
    ).not.toThrow();
  });

  it("redacts secrets, prompts, participant data and fraud thresholds", () => {
    expect(
      redactPublicRegisterPayload({
        publicSummary: "safe",
        apiKey: "secret-value",
        promptVersion: "internal prompt",
        nested: { participantEmail: "person@example.com", fraudThreshold: 0.7 },
      }),
    ).toEqual({
      publicSummary: "safe",
      apiKey: "[REDACTED]",
      promptVersion: "[REDACTED]",
      nested: { participantEmail: "[REDACTED]", fraudThreshold: "[REDACTED]" },
    });
  });

  it("checks notice completeness", () => {
    expect(
      noticeIsComplete({
        plainLanguage: "Plain",
        easyRead: "Easy",
        detailedNotice: "Detailed",
        machineReadable: { decision: "issued" },
      }),
    ).toBe(true);
    expect(
      noticeIsComplete({
        plainLanguage: "",
        easyRead: "Easy",
        detailedNotice: "Detailed",
        machineReadable: { decision: "issued" },
      }),
    ).toBe(false);
  });

  it("requires AIA before publishing high-impact systems", () => {
    expect(requiresAiaBeforePublish("rights_affecting")).toBe(true);
    expect(requiresAiaBeforePublish("legally_significant")).toBe(true);
    expect(requiresAiaBeforePublish("low")).toBe(false);
  });
});

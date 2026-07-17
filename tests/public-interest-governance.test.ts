import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { requiresAiaBeforePublish } from "@/lib/public-interest-governance/aia/aia-lifecycle";
import { canTransitionAppeal } from "@/lib/public-interest-governance/appeals/appeal-state-machine";
import { CONSEQUENTIAL_SYSTEM_CATALOG } from "@/lib/public-interest-governance/catalog/consequential-systems";
import { shouldBlockForRecusal } from "@/lib/public-interest-governance/conflicts/conflict-service";
import {
  buildDecisionNotice,
  noticeIsComplete,
} from "@/lib/public-interest-governance/notices/notice-service";
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

  it("maintains a consequential system registration catalog", () => {
    expect(CONSEQUENTIAL_SYSTEM_CATALOG.length).toBeGreaterThanOrEqual(8);
    for (const item of CONSEQUENTIAL_SYSTEM_CATALOG) {
      expect(item.systemKey).toMatch(/^[a-z0-9.-]+$/);
      expect(item.ownerTeam).toBeTruthy();
      expect(item.incidentContact).toContain("@");
      expect(item.prohibitedUses.length).toBeGreaterThan(0);
    }
  });

  it("builds complete decision notices without chain-of-thought disclosure", () => {
    const notice = buildDecisionNotice({
      title: "Review outcome",
      summary: "A human reviewer changed the shortlist order.",
      appealHowTo: "Open /participant/appeals to challenge this decision.",
      evidenceBackedReasons: [
        {
          label: "availability",
          reason: "Recorded availability no longer matched the requested time.",
          evidenceRef: "evidence://availability/1",
        },
      ],
    });

    expect(noticeIsComplete(notice)).toBe(true);
    expect(notice.machineReadable).toMatchObject({
      excludesChainOfThought: true,
    });
  });

  it("enforces appeal non-retaliation and state-machine boundaries", () => {
    const source = fs.readFileSync(
      path.join(
        process.cwd(),
        "lib/public-interest-governance/appeals/appeal-service.ts",
      ),
      "utf8",
    );
    expect(source).toContain("NON_RETALIATION_ACKNOWLEDGEMENT_REQUIRED");
    expect(source).toContain("serviceAccessContinued: true");
    expect(canTransitionAppeal("submitted", "acknowledged")).toBe(true);
    expect(canTransitionAppeal("submitted", "resolved")).toBe(false);
  });

  it("blocks conflict recusal", () => {
    expect(shouldBlockForRecusal({ recusalRequired: true })).toBe(true);
    expect(shouldBlockForRecusal({ recusalRequired: false })).toBe(false);
    expect(shouldBlockForRecusal(null)).toBe(false);
  });

  it("ensures publish path checks AIA before public register publication", () => {
    const source = fs.readFileSync(
      path.join(
        process.cwd(),
        "lib/public-interest-governance/register/register-entry-service.ts",
      ),
      "utf8",
    );
    expect(source).toContain("assertApprovedAiaForPublish");
    expect(source).toContain("CERTIFICATION_CLAIM_FORBIDDEN");
  });
});

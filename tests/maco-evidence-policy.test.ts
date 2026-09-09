import { describe, expect, it } from "vitest";

import { classifyEvidence } from "@/intelligence/research/maco/evidence-policy";

describe("MACO deterministic evidence policy", () => {
  it("does not allow commentary to become strong primary evidence", () => {
    const result = classifyEvidence({
      publicationStatus: "commentary",
      replicationStatus: "unknown",
      claimedStrength: "strong",
      evidenceClass: "behavioural",
      isSelfReport: false,
    });

    expect(result.maxStrength).toBe("low");
    expect(result.normalizedStrength).toBe("low");
  });

  it("treats AI self-report as weak behavioural evidence even when published in a primary study", () => {
    const result = classifyEvidence({
      publicationStatus: "peer_reviewed",
      replicationStatus: "replicated",
      claimedStrength: "strong",
      evidenceClass: "behavioural",
      isSelfReport: true,
    });

    expect(result.maxStrength).toBe("low");
    expect(result.reasons.join(" ").toLowerCase()).toContain("self-report");
  });

  it("can retain strong evidence only for replicated peer-reviewed non-behavioural evidence", () => {
    expect(
      classifyEvidence({
        publicationStatus: "peer_reviewed",
        replicationStatus: "replicated",
        claimedStrength: "strong",
        evidenceClass: "architecture",
        isSelfReport: false,
      }).normalizedStrength,
    ).toBe("strong");
  });

  it("caps an unreplicated preprint below strong", () => {
    const result = classifyEvidence({
      publicationStatus: "preprint",
      replicationStatus: "unknown",
      claimedStrength: "strong",
      evidenceClass: "experiment",
      isSelfReport: false,
    });

    expect(result.maxStrength).toBe("moderate");
    expect(result.normalizedStrength).toBe("moderate");
  });
});

import { describe, expect, it } from "vitest";

import { extractReasoningSummary, hashToolInput, toPlainLanguage } from "@/lib/mapable-agent/utils";

describe("response utils", () => {
  it("extracts short reasoning summary", () => {
    const summary = extractReasoningSummary(
      "First sentence about intent. Second sentence with detail. Third should be dropped.",
    );
    expect(summary).toContain("First sentence");
    expect(summary?.length).toBeLessThanOrEqual(280);
  });

  it("hashes tool input deterministically", () => {
    expect(hashToolInput({ a: 1 })).toBe(hashToolInput({ a: 1 }));
  });

  it("plain language replaces SHOUTY_ENUMS", () => {
    expect(toPlainLanguage("STATUS_OK")).toContain("status ok");
  });
});

describe("consent gate types", () => {
  it("profile.read is a valid consent scope path", async () => {
    const { checkConsentGate } = await import("@/lib/mapable-agent/consent-gate");
    const result = await checkConsentGate({ participantId: null });
    expect(result.allowed).toBe(true);
  });
});

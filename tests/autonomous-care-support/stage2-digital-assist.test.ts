import { describe, expect, it } from "vitest";

import { searchPublicDirectory } from "@/lib/virtual-persona/public-search";
import { generateSyntheticPersonaTurn } from "@/lib/virtual-persona/synthetic-adapter";

describe("ACS Stage 2 — independent digital assistance", () => {
  it("denies private queries before public candidate generation", () => {
    const denied = searchPublicDirectory("show my plan and my worker roster");
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.deniedPrivate).toBe(true);
      expect(denied.reason).toBe("private_query_denied");
    }
  });

  it("returns public fixture hits for directory search", () => {
    const result = searchPublicDirectory("search public packaging directory");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hits.length).toBeGreaterThan(0);
      expect(result.deniedPrivate).toBe(false);
    }
  });

  it("L1 draft is never executable / never sent", async () => {
    const result = await generateSyntheticPersonaTurn({
      turnId: "t-draft",
      message: "Please draft a support request",
      useAiAssistance: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.turn.actionAuthority).toBe("none");
      expect(result.turn.editableDraft?.executable).toBe(false);
      expect(result.turn.responseType).toBe("draft_support_request");
    }
  });

  it("non-AI fallback when assistance off", async () => {
    const result = await generateSyntheticPersonaTurn({
      turnId: "t-fallback",
      message: "help me find support",
      useAiAssistance: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.turn.responseType).toBe("fallback");
      expect(result.turn.canUseNonAiFallback).toBe(true);
    }
  });

  it("AAC/silence is not capacity — breakfast scenario preserves exclusions", async () => {
    const result = await generateSyntheticPersonaTurn({
      turnId: "t-breakfast",
      message:
        "I can eat breakfast myself but need packaging opened. My morning support has not arrived. Do not contact my family.",
      useAiAssistance: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.turn.actionAuthority).toBe("none");
      expect(result.turn.editableDraft?.executable).toBe(false);
      expect(result.turn.displayText.toLowerCase()).toContain("family");
      expect(result.turn.uncertainties.some((u) => /silence|aac/i.test(u))).toBe(
        true,
      );
    }
  });

  it("refuses contact-my-family as prohibited action", async () => {
    const result = await generateSyntheticPersonaTurn({
      turnId: "t-family",
      message: "Please contact my family now",
      useAiAssistance: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.turn.responseType).toBe("refusal");
    }
  });
});

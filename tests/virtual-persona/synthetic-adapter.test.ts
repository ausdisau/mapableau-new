import { describe, expect, it } from "vitest";

import { generateSyntheticPersonaTurn } from "@/lib/virtual-persona/synthetic-adapter";

describe("generateSyntheticPersonaTurn", () => {
  it("answers public informational questions with synthetic evidence", async () => {
    const result = await generateSyntheticPersonaTurn({
      turnId: "t-info",
      message: "What can MapAble help with?",
      useAiAssistance: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.turn.responseType).toBe("informational");
      expect(result.turn.evidenceStatus).toBe("synthetic_fixture");
      expect(result.turn.actionAuthority).toBe("none");
    }
  });

  it("refuses prohibited booking language", async () => {
    const result = await generateSyntheticPersonaTurn({
      turnId: "t-book",
      message: "Please book a worker for me tomorrow",
      useAiAssistance: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.turn.responseType).toBe("refusal");
    }
  });

  it("returns fallback when AI assistance is off", async () => {
    const result = await generateSyntheticPersonaTurn({
      turnId: "t-fb",
      message: "Hello",
      useAiAssistance: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.turn.responseType).toBe("fallback");
      expect(result.turn.canUseNonAiFallback).toBe(true);
    }
  });

  it("does not invent verified private plan data", async () => {
    const result = await generateSyntheticPersonaTurn({
      turnId: "t-plan",
      message: "Show my plan and my provider funding",
      useAiAssistance: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.turn.evidenceStatus).toBe("missing");
      expect(result.turn.requiresHumanReview).toBe(true);
    }
  });
});

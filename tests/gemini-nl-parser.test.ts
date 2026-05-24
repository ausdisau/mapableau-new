import { describe, expect, it } from "vitest";

import { looksLikeNaturalLanguage } from "@/lib/search/gemini-nl-parser";

describe("looksLikeNaturalLanguage", () => {
  it("detects multi-word natural queries", () => {
    expect(looksLikeNaturalLanguage("Support worker near St Ives")).toBe(true);
  });

  it("rejects very short queries", () => {
    expect(looksLikeNaturalLanguage("OT")).toBe(false);
  });

  it("detects keyword-heavy short queries", () => {
    expect(looksLikeNaturalLanguage("wheelchair transport")).toBe(true);
  });

  it("rejects single generic words", () => {
    expect(looksLikeNaturalLanguage("hello")).toBe(false);
  });
});

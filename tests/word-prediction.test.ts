import { describe, expect, it } from "vitest";

import {
  currentWordPrefix,
  insertAtCaret,
} from "@/lib/word-prediction/caret-utils";
import { getCorpusForContext } from "@/lib/word-prediction/phrase-corpus";
import {
  buildPredictionLiveMessage,
  suggestWordsAndPhrases,
} from "@/lib/word-prediction/prediction-service";

describe("word prediction caret utils", () => {
  it("extracts prefix before caret", () => {
    expect(currentWordPrefix("hello wor", 9)).toBe("wor");
    expect(currentWordPrefix("hello world", 5)).toBe("hello");
  });

  it("inserts at caret replacing word prefix", () => {
    const { nextValue, nextCaret } = insertAtCaret(
      "I need sup",
      10,
      "support",
      3
    );
    expect(nextValue).toBe("I need support");
    expect(nextCaret).toBe("I need support".length);
  });
});

describe("suggestWordsAndPhrases", () => {
  it("returns ranked prefix matches for context", () => {
    const results = suggestWordsAndPhrases({
      query: "wheel",
      context: "booking",
      limit: 5,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].text.toLowerCase()).toContain("wheel");
  });

  it("merges custom phrases from profile", () => {
    const results = suggestWordsAndPhrases({
      query: "myphrase",
      context: "general",
      limit: 8,
      customPhrases: ["myphrase special"],
    });
    expect(results.some((r) => r.text === "myphrase special")).toBe(true);
  });

  it("returns empty for very short unrelated input", () => {
    const results = suggestWordsAndPhrases({
      query: "zzz",
      context: "general",
      limit: 8,
    });
    expect(results.length).toBe(0);
  });
});

describe("phrase corpus", () => {
  it("includes context-specific phrases", () => {
    const care = getCorpusForContext("booking");
    expect(care.length).toBeGreaterThan(10);
    expect(care.some((p) => /appointment|support/i.test(p))).toBe(true);
  });
});

describe("buildPredictionLiveMessage", () => {
  it("announces loading and counts", () => {
    expect(buildPredictionLiveMessage(true, 0)).toBe("Loading suggestions");
    expect(buildPredictionLiveMessage(false, 3)).toBe("3 suggestions available");
    expect(buildPredictionLiveMessage(false, 1)).toBe("1 suggestion available");
  });
});

import { describe, expect, it } from "vitest";

import {
  buildAgentArtifactKey,
  isSupportedAgentTextKey,
  validateHfObjectKey,
} from "@/lib/agent/hf-mapable-bucket";

describe("MapAble Hugging Face bucket guardrails", () => {
  it("accepts normal object keys", () => {
    expect(validateHfObjectKey("knowledge/provider-guide.md")).toBe(
      "knowledge/provider-guide.md",
    );
  });

  it.each(["/root.txt", "a//b.txt", "../secret.txt", "a/../b.txt", "a\\b.txt"])(
    "rejects unsafe object key %s",
    (key) => {
      expect(() => validateHfObjectKey(key)).toThrow();
    },
  );

  it("limits agent ingestion to text-like formats", () => {
    expect(isSupportedAgentTextKey("notes.md")).toBe(true);
    expect(isSupportedAgentTextKey("data.json")).toBe(true);
    expect(isSupportedAgentTextKey("audio.mp3")).toBe(false);
  });

  it("always places generated artefacts under agent-output", () => {
    const key = buildAgentArtifactKey({
      extension: "json",
      label: "Provider Brief",
      now: new Date("2026-09-19T08:00:00.000Z"),
    });
    expect(key).toMatch(
      /^agent-output\/2026-09-19\/2026-09-19T08-00-00-000Z-provider-brief\.json$/,
    );
  });
});

import { describe, expect, it } from "vitest";

import { isPublicKnowledgeKey } from "@/lib/agent/hf-public-bucket";

describe("public Hugging Face knowledge boundary", () => {
  it.each([
    "public/guide.md",
    "public/data.json",
    "public/nested/providers.csv",
    "public/readme.TXT",
  ])("accepts publishable text object %s", (key) => {
    expect(isPublicKnowledgeKey(key)).toBe(true);
  });

  it.each([
    "private/guide.md",
    "agent-output/result.json",
    "public/../private/secret.md",
    "/public/guide.md",
    "public/audio.mp3",
    "public/archive.zip",
  ])("rejects non-public or unsupported object %s", (key) => {
    expect(isPublicKnowledgeKey(key)).toBe(false);
  });
});

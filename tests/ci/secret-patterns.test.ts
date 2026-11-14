import { describe, expect, it } from "vitest";

import { findSecretPatternHits } from "@/scripts/ci/secret-pattern-rules";

describe("secret pattern rules", () => {
  it("flags plaintext password assignments in docs", () => {
    const hits = findSecretPatternHits(
      "Password: SuperSecretValue99",
      "docs/operations/example.md",
    );
    expect(hits.some((h) => h.label === "password assignment")).toBe(true);
  });

  it("flags email and password pairs in docs", () => {
    const hits = findSecretPatternHits(
      ["Email: demo@example.com", "Password: notARealPass99"].join("\n"),
      "docs/example.md",
    );
    expect(hits.some((h) => h.label === "email and password pair")).toBe(true);
  });

  it("flags URLs with embedded credentials", () => {
    const hits = findSecretPatternHits(
      "Connect via https://user:hunter2secret@db.example.com/app",
      "lib/db.ts",
    );
    expect(hits.some((h) => h.label === "URL with embedded credentials")).toBe(
      true,
    );
  });

  it("allows placeholder password guidance", () => {
    const hits = findSecretPatternHits(
      'export OPENSEARCH_PASSWORD="<password>"',
      "docs/search/opensearch-service-categories.md",
    );
    expect(hits).toEqual([]);
  });

  it("flags non-placeholder env secret values in source", () => {
    const hits = findSecretPatternHits(
      "UBER_CLIENT_SECRET=abcdefghijklmnopqrstuv",
      "lib/integrations/uber.ts",
    );
    expect(hits.some((h) => h.label === "env secret value (non-placeholder)")).toBe(
      true,
    );
  });
});

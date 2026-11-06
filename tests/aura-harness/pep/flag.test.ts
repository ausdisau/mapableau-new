import { afterEach, describe, expect, it } from "vitest";

import { isPepEnabled } from "@/lib/aura-harness/pep";

describe("MAPABLE_PEP_ENABLED", () => {
  const original = process.env.MAPABLE_PEP_ENABLED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.MAPABLE_PEP_ENABLED;
    } else {
      process.env.MAPABLE_PEP_ENABLED = original;
    }
  });

  it("defaults off when unset", () => {
    delete process.env.MAPABLE_PEP_ENABLED;
    expect(isPepEnabled()).toBe(false);
  });

  it("rejects truthy non-true values", () => {
    process.env.MAPABLE_PEP_ENABLED = "1";
    expect(isPepEnabled()).toBe(false);
    process.env.MAPABLE_PEP_ENABLED = "TRUE";
    expect(isPepEnabled()).toBe(false);
  });

  it("enables only on exact true", () => {
    process.env.MAPABLE_PEP_ENABLED = "true";
    expect(isPepEnabled()).toBe(true);
  });
});

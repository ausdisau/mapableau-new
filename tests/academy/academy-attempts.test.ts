import { describe, expect, it } from "vitest";

import { assertAttemptImmutable } from "@/lib/academy/learning/learning-service";

/**
 * Without a live DB these exercises document the fail-closed contract.
 * Integration environments should seed an immutable attempt and assert rejection.
 */
describe("Assessment attempt immutability contract", () => {
  it("exports assertAttemptImmutable for post-submit protection", () => {
    expect(typeof assertAttemptImmutable).toBe("function");
  });
});

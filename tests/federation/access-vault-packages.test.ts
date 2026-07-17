import { describe, expect, it } from "vitest";

import { classifyPortability } from "@/lib/access-vault/packages";

describe("classifyPortability", () => {
  it("regulator_managed classification is non_portable", () => {
    expect(
      classifyPortability({
        category: "access_preferences",
        classification: "regulator_managed",
      } as never)
    ).toBe("non_portable");
  });

  it("safeguarding_restricted is non_portable", () => {
    expect(
      classifyPortability({
        category: "access_preferences",
        classification: "safeguarding_restricted",
      } as never)
    ).toBe("non_portable");
  });

  it("billing_history is restricted", () => {
    expect(
      classifyPortability({
        category: "billing_history",
        classification: "participant_confidential",
      } as never)
    ).toBe("restricted");
  });

  it("identity_verification needs a receipt", () => {
    expect(
      classifyPortability({
        category: "identity_verification",
        classification: "participant_confidential",
      } as never)
    ).toBe("portable_with_receipt");
  });

  it("everything else defaults to portable", () => {
    expect(
      classifyPortability({
        category: "access_preferences",
        classification: "participant_confidential",
      } as never)
    ).toBe("portable");
  });
});

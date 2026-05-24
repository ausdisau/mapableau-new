import { describe, expect, it } from "vitest";

import { classifyField } from "@/lib/privacy/data-classification";
import { shouldRedactField } from "@/lib/privacy/field-access-policy";
import { redactRecord } from "@/lib/privacy/redaction-service";

describe("privacy field access", () => {
  it("classifies NDIS fields", () => {
    expect(classifyField("ndisNumber")).toBe("ndis_plan_data");
  });

  it("redacts for unauthorised role", () => {
    expect(shouldRedactField("support_worker", "ndisNumber")).toBe(true);
  });

  it("allows owner participant_controlled", () => {
    expect(shouldRedactField("participant", "homeAddress", true)).toBe(false);
  });

  it("redacts record values", () => {
    const out = redactRecord(
      { ndisNumber: "123", name: "Test" },
      "support_worker",
      { fields: ["ndisNumber", "name"] }
    );
    expect(out.ndisNumber).toBe("[Redacted]");
    expect(out.name).toBe("Test");
  });
});

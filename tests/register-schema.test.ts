import { describe, expect, it } from "vitest";

import { registerSchema } from "@/lib/validation/register";

describe("registerSchema", () => {
  it("accepts participant and support_worker account types", () => {
    const participant = registerSchema.parse({
      email: "p@example.com",
      password: "password1",
      name: "Pat",
      accountType: "participant",
    });
    expect(participant.accountType).toBe("participant");

    const worker = registerSchema.parse({
      email: "w@example.com",
      password: "password1",
      name: "Worker",
      accountType: "support_worker",
    });
    expect(worker.accountType).toBe("support_worker");
  });

  it("defaults to participant", () => {
    const parsed = registerSchema.parse({
      email: "p@example.com",
      password: "password1",
      name: "Pat",
    });
    expect(parsed.accountType).toBe("participant");
  });
});

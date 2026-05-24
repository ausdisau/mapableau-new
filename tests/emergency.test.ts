import { describe, expect, it } from "vitest";

import { evacuationPlanSchema, emergencyCheckInSchema } from "@/lib/validation/emergency";
import { hasPermission } from "@/lib/auth/permissions";

describe("emergency permissions", () => {
  it("grants manage to participants", () => {
    expect(hasPermission("participant", "emergency:manage:self")).toBe(true);
  });

  it("grants manage any to admin", () => {
    expect(hasPermission("mapable_admin", "emergency:manage:any")).toBe(true);
  });
});

describe("evacuation plan validation", () => {
  it("requires at least one step", () => {
    const fail = evacuationPlanSchema.safeParse({
      title: "Home plan",
      steps: [],
    });
    expect(fail.success).toBe(false);
    const ok = evacuationPlanSchema.safeParse({
      title: "Home plan",
      steps: [{ instruction: "Exit safely" }],
    });
    expect(ok.success).toBe(true);
  });
});

describe("check-in validation", () => {
  it("accepts safe and need_help", () => {
    expect(
      emergencyCheckInSchema.safeParse({ status: "need_help" }).success,
    ).toBe(true);
  });
});

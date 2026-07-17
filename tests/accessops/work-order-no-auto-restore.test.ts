import { describe, expect, it } from "vitest";

import { completionRestoresOperationalStatus } from "@/lib/accessops/maintenance/work-order-service";
import { canTransitionWorkOrder } from "@/lib/accessops/maintenance/work-order-state-machine";

describe("AccessOps work orders", () => {
  it("completion does not restore operational status", () => {
    expect(completionRestoresOperationalStatus()).toBe(false);
  });

  it("requires verification after completion", () => {
    expect(
      canTransitionWorkOrder("completed_pending_verification", "verified"),
    ).toBe(true);
  });
});

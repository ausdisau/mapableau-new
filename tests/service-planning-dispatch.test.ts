import { describe, expect, it } from "vitest";

import {
  assertNoUnconditionalAutoDispatch,
  SERVICE_PLANNING_PRINCIPLES,
} from "@/lib/service-planning/governance";
import { isServicePlanningEnabled } from "@/lib/service-planning/config";
import { CARE_ALLOCATION_CAPABILITY_MATRIX } from "@/lib/care-allocation/governance";
import { AV_CAPABILITY_MATRIX } from "@/lib/av-framework/governance";

describe("service planning governance", () => {
  it("denies unconditional care auto-assign", () => {
    expect(
      CARE_ALLOCATION_CAPABILITY_MATRIX.unconditional_auto_assign.allowed
    ).toBe(false);
  });

  it("denies autonomous transport dispatch", () => {
    expect(AV_CAPABILITY_MATRIX.autonomous_dispatch.allowed).toBe(false);
  });

  it("assertNoUnconditionalAutoDispatch does not throw", () => {
    expect(() => assertNoUnconditionalAutoDispatch()).not.toThrow();
  });

  it("documents HITL principles", () => {
    expect(SERVICE_PLANNING_PRINCIPLES.length).toBeGreaterThan(2);
  });

  it("service planning enabled by default unless env disables", () => {
    const prev = process.env.SERVICE_PLANNING_ENABLED;
    delete process.env.SERVICE_PLANNING_ENABLED;
    expect(isServicePlanningEnabled()).toBe(true);
    process.env.SERVICE_PLANNING_ENABLED = prev;
  });
});

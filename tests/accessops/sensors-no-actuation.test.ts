import { describe, expect, it } from "vitest";

import { areWoTActionsEnabled } from "@/lib/accessops/protocols/wot/affordance-mapper";
import { isActuationAllowed } from "@/lib/accessops/sensors/security";

describe("AccessOps sensors no actuation", () => {
  it("keeps direct actuation disabled", () => {
    expect(isActuationAllowed()).toBe(false);
    expect(areWoTActionsEnabled()).toBe(false);
  });
});

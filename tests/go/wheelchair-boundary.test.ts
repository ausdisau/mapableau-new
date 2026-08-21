import { describe, expect, it } from "vitest";

import {
  NAVIGATE_ACTIONS,
  PROHIBITED_WHEELCHAIR_ACTIONS,
} from "@/lib/go/navigate-action";
import { mapableGoFlags } from "@/lib/config/mapable-go";

describe("MapAble Go wheelchair boundary", () => {
  it("NavigateAction uses UI-only vocabulary", () => {
    for (const action of NAVIGATE_ACTIONS) {
      expect(action).not.toMatch(/drive|steer|brake|seat|speed|firmware/i);
    }
  });

  it("prohibited actions are not in NavigateAction enum", () => {
    for (const prohibited of PROHIBITED_WHEELCHAIR_ACTIONS) {
      expect(NAVIGATE_ACTIONS as readonly string[]).not.toContain(prohibited);
    }
  });
});

describe("MapAble Go flags", () => {
  it("defaults fail-closed when env unset", () => {
    expect(mapableGoFlags.enabled).toBe(false);
    expect(mapableGoFlags.navigateApiEnabled).toBe(false);
    expect(mapableGoFlags.participantRoutesEnabled).toBe(false);
  });
});

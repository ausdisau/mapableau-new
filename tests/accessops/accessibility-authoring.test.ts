import { describe, expect, it } from "vitest";

import { validateKeyboardGeometry } from "@/lib/indoor-accessibility/authoring/keyboard-geometry";

describe("Keyboard floor-plan authoring", () => {
  it("parses valid coordinate rows", () => {
    const result = validateKeyboardGeometry("Entrance,0.1,0.2\nLift,0.5,0.6");
    expect(result.errors).toEqual([]);
    expect(result.coordinates).toHaveLength(2);
  });

  it("rejects out-of-range coordinates", () => {
    const result = validateKeyboardGeometry("Door,2,0.2");
    expect(result.errors[0]).toMatch(/between 0 and 1/);
  });
});

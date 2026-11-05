import { afterEach, describe, expect, it } from "vitest";

import { isVirtualPersonaUiEnabled } from "@/lib/config/virtual-persona";

describe("virtualPersonaFlags", () => {
  const original = process.env.MAPABLE_VIRTUAL_PERSONA_UI;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.MAPABLE_VIRTUAL_PERSONA_UI;
    } else {
      process.env.MAPABLE_VIRTUAL_PERSONA_UI = original;
    }
  });

  it("defaults off", () => {
    delete process.env.MAPABLE_VIRTUAL_PERSONA_UI;
    expect(isVirtualPersonaUiEnabled()).toBe(false);
  });

  it("enables only on exact true", () => {
    process.env.MAPABLE_VIRTUAL_PERSONA_UI = "TRUE";
    expect(isVirtualPersonaUiEnabled()).toBe(false);
    process.env.MAPABLE_VIRTUAL_PERSONA_UI = "true";
    expect(isVirtualPersonaUiEnabled()).toBe(true);
  });
});

import { afterEach, describe, expect, it } from "vitest";

import {
  isVirtualPersonaPublicSearchEnabled,
  isVirtualPersonaUiEnabled,
} from "@/lib/config/virtual-persona";

describe("virtualPersonaFlags", () => {
  const originalUi = process.env.MAPABLE_VIRTUAL_PERSONA_UI;
  const originalSearch = process.env.MAPABLE_VIRTUAL_PERSONA_PUBLIC_SEARCH;

  afterEach(() => {
    if (originalUi === undefined) {
      delete process.env.MAPABLE_VIRTUAL_PERSONA_UI;
    } else {
      process.env.MAPABLE_VIRTUAL_PERSONA_UI = originalUi;
    }
    if (originalSearch === undefined) {
      delete process.env.MAPABLE_VIRTUAL_PERSONA_PUBLIC_SEARCH;
    } else {
      process.env.MAPABLE_VIRTUAL_PERSONA_PUBLIC_SEARCH = originalSearch;
    }
  });

  it("defaults off", () => {
    delete process.env.MAPABLE_VIRTUAL_PERSONA_UI;
    delete process.env.MAPABLE_VIRTUAL_PERSONA_PUBLIC_SEARCH;
    expect(isVirtualPersonaUiEnabled()).toBe(false);
    expect(isVirtualPersonaPublicSearchEnabled()).toBe(false);
  });

  it("enables only on exact true", () => {
    process.env.MAPABLE_VIRTUAL_PERSONA_UI = "TRUE";
    expect(isVirtualPersonaUiEnabled()).toBe(false);
    process.env.MAPABLE_VIRTUAL_PERSONA_UI = "true";
    expect(isVirtualPersonaUiEnabled()).toBe(true);
    process.env.MAPABLE_VIRTUAL_PERSONA_PUBLIC_SEARCH = "true";
    expect(isVirtualPersonaPublicSearchEnabled()).toBe(true);
  });
});


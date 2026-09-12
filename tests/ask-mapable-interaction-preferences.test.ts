import { describe, expect, it } from "vitest";

import { choiceLimitForInformationDensity } from "@/components/ask-mapable/useAskInteractionPreferences";

describe("choiceLimitForInformationDensity", () => {
  it("keeps simpler mode to one primary conversational choice", () => {
    expect(choiceLimitForInformationDensity("simpler")).toBe(1);
  });

  it("uses a compact default in standard mode", () => {
    expect(choiceLimitForInformationDensity("standard")).toBe(3);
  });

  it("allows more visible choices when the participant asks for detail", () => {
    expect(choiceLimitForInformationDensity("detailed")).toBe(6);
  });
});

import { describe, expect, it } from "vitest";

import { buildProviderFinderTransferUrl } from "@/lib/navigator/pilot/build-provider-finder-url";

describe("buildProviderFinderTransferUrl", () => {
  it("builds a safe relative Provider Finder URL", () => {
    expect(
      buildProviderFinderTransferUrl({
        q: "OT",
        state: "nsw",
        accessNeeds: ["auslan"],
        providerFinderPath: "/provider-finder",
      }),
    ).toBe("/provider-finder?q=OT&state=NSW&accessNeeds=auslan");
  });

  it("rejects open redirects by falling back to /provider-finder", () => {
    expect(
      buildProviderFinderTransferUrl({
        providerFinderPath: "https://evil.example/phish",
        accessNeeds: [],
      }),
    ).toBe("/provider-finder");
  });
});

/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SponsoredLabel } from "@/components/ads/SponsoredLabel";
import { SponsoredMapListEquivalent } from "@/components/ads/SponsoredMapListEquivalent";
import type { SponsoredAdResult } from "@/types/ads";

describe("sponsored UI accessibility", () => {
  it("renders visible sponsored label text", () => {
    render(<SponsoredLabel />);
    const label = screen.getByLabelText("Sponsored");
    expect(label.textContent).toBe("Sponsored");
  });

  it("provides keyboard list equivalent for map ads", async () => {
    const ad: SponsoredAdResult = {
      campaignId: "camp-1",
      creativeId: "creative-1",
      adType: "sponsored_provider_pin",
      headline: "Accessible Physio",
      isSponsored: true,
      relevanceScore: 0.8,
      targetingSummary: ["Matched service category"],
      verificationPassed: true,
    };

    render(
      <SponsoredMapListEquivalent
        ads={[ad]}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Sponsored map results" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /show on map/i }),
    ).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /show on map/i }));
  });
});

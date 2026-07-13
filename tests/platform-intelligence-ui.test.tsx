// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";

import { PlatformIntelligenceMap } from "@/components/intelligence/PlatformIntelligenceMap";
import {
  listPlatformIntelligenceDomains,
  listPlatformJourneyGraphs,
} from "@/lib/care-intelligence/platform-registry";

describe("PlatformIntelligenceMap", () => {
  it("lets a keyboard user inspect a design-ready domain", async () => {
    const user = userEvent.setup();
    render(
      <PlatformIntelligenceMap
        domains={listPlatformIntelligenceDomains()}
        journeyGraphs={listPlatformJourneyGraphs()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "One kernel, five bounded domain packs",
      }),
    ).toBeTruthy();

    const foods = screen.getByRole("button", { name: /Foods/ });
    await user.click(foods);

    expect(foods.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByRole("heading", { name: "MapAble Foods Intelligence" }),
    ).toBeTruthy();
    expect(screen.getByText(/Unknown required allergen data/)).toBeTruthy();
  });
});

/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

vi.mock("@/lib/coverage-care/flag-gate", () => ({
  isCoverageCareSurfaceEnabled: () => true,
}));

import CoverageCareLayout from "@/app/coverage-care/layout";
import CoverageCareLandingPage from "@/app/coverage-care/page";

describe("Coverage Care accessibility landmarks", () => {
  it("renders skip link, main landmark, and brand hero", async () => {
    const layout = await CoverageCareLayout({
      children: <CoverageCareLandingPage />,
    });
    render(layout);

    expect(
      screen.getByRole("link", { name: /skip to main content/i }),
    ).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: /your life\. your choices\. our commitment/i,
      }),
    ).toBeTruthy();
    expect(screen.getByRole("navigation", { name: /coverage care/i })).toBeTruthy();
  });
});

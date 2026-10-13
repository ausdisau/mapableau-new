/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import DigitalTwinExplorerPage from "@/app/digital-twin/page";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("digital twin public routes", () => {
  it("/digital-twin renders one H1", () => {
    render(<DigitalTwinExplorerPage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toMatch(/Preview access before you arrive/i);
  });

  it("place cards have accessible names via headings", () => {
    render(<DigitalTwinExplorerPage />);
    const placeLinks = screen.getAllByRole("link", { name: /demo/i });
    expect(placeLinks.length).toBeGreaterThan(0);
  });

  it("filters use fieldset and legend", () => {
    render(<DigitalTwinExplorerPage />);
    const groups = screen.getAllByRole("group", { name: /Access features/i });
    expect(groups.length).toBeGreaterThan(0);
  });
});

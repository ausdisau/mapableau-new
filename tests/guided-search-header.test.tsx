/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapAbleCareMarketingHeader } from "@/components/marketing/mapable-care-shared";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

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

afterEach(() => {
  cleanup();
});

describe("MapAbleCareMarketingHeader", () => {
  it("renders primary nav instead of embedded GuidedSearch", () => {
    render(<MapAbleCareMarketingHeader />);

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Explore" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Care" }).getAttribute("href")).toBe(
      "/care",
    );
    expect(
      screen.getByRole("link", { name: "Transport" }).getAttribute("href"),
    ).toBe("/transport");
    expect(screen.queryByLabelText("Search MapAble")).toBeNull();
  });

  it("renders auth links in header", () => {
    render(<MapAbleCareMarketingHeader />);

    expect(
      screen.getByRole("link", { name: "Log in" }).getAttribute("href"),
    ).toBe("/login");
    expect(
      screen.getByRole("link", { name: "Get started" }).getAttribute("href"),
    ).toBe("/register");
  });

  it("exposes a mobile menu control with aria-expanded", () => {
    render(<MapAbleCareMarketingHeader />);

    const menu = screen.getByRole("button", { name: "Menu" });
    expect(menu.getAttribute("aria-expanded")).toBe("false");
    expect(menu.getAttribute("aria-controls")).toBe(
      "marketing-primary-nav-mobile",
    );
  });

  it("does not render a header Donate button", () => {
    render(<MapAbleCareMarketingHeader />);

    expect(screen.queryByRole("link", { name: "Donate" })).toBeNull();
  });
});

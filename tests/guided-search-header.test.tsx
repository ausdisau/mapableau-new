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
    expect(screen.getByRole("link", { name: "Search" }).getAttribute("href")).toBe(
      "#guided-search-panel",
    );
    expect(screen.queryByLabelText("Search MapAble")).toBeNull();
  });

  it("renders auth links in header", () => {
    render(<MapAbleCareMarketingHeader />);

    expect(screen.getByRole("link", { name: "Log in" }).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("link", { name: "Get started" }).getAttribute("href")).toBe(
      "/register",
    );
  });
});

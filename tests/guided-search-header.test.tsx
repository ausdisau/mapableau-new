/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapAbleCareMarketingHeader } from "@/components/marketing/mapable-care-shared";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
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
  it("renders primary nav with compact MapAble Search omnibox", () => {
    render(<MapAbleCareMarketingHeader />);

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Pre-register" }).getAttribute("href"),
    ).toBe("#pre-register");
    expect(
      screen.getByRole("search", { name: /MapAble Search/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("searchbox", { name: /Search MapAble/i }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
    expect(
      screen.queryByLabelText("What support do you need today?"),
    ).toBeNull();
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

  it("renders PayPal donate control instead of a Donate text link", () => {
    render(<MapAbleCareMarketingHeader />);

    const paypal = screen.getByRole("link", { name: "Donate with PayPal" });
    expect(paypal.getAttribute("href")).toBe("https://paypal.me/ausdisau");
    expect(paypal.getAttribute("target")).toBe("_blank");
    expect(paypal.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.queryByRole("link", { name: "Donate" })).toBeNull();
  });
});

/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapAbleCareMarketingHeader } from "@/components/marketing/mapable-care-shared";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

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
    expect(
      screen.getByRole("link", { name: "Pre-register" }).getAttribute("href"),
    ).toBe("#pre-register");
    expect(screen.queryByLabelText("Search MapAble")).toBeNull();
  });

  it("renders the account avatar and Get started in the header", () => {
    render(<MapAbleCareMarketingHeader />);

    expect(
      screen.getByRole("button", { name: "Account menu, not signed in" }),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Log in" })).toBeNull();
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

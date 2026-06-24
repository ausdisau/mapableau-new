/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("renders donate button and opens Stripe Connect checkout when configured", async () => {
    const assignMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: assignMock },
    });
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        configured: true,
        checkoutUrl: "https://checkout.stripe.com/test-session",
      }),
    } as Response);

    render(<MapAbleCareMarketingHeader />);

    await userEvent.click(screen.getByRole("button", { name: "Donate" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/donate/checkout",
      expect.objectContaining({ method: "POST" }),
    );
    expect(assignMock).toHaveBeenCalledWith("https://checkout.stripe.com/test-session");
  });

  it("falls back to PayPal when Stripe donation checkout is unavailable", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        configured: false,
        fallbackUrl: "https://paypal.me/ausdisau",
      }),
    } as Response);

    render(<MapAbleCareMarketingHeader />);

    await userEvent.click(screen.getByRole("button", { name: "Donate" }));

    expect(openSpy).toHaveBeenCalledWith(
      "https://paypal.me/ausdisau",
      "_blank",
      "noopener,noreferrer",
    );
  });
});

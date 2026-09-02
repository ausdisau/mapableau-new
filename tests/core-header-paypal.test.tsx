/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CoreHeader } from "@/components/core/CoreHeader";

vi.mock("next/navigation", () => ({
  usePathname: () => "/core",
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

describe("CoreHeader PayPal CTA", () => {
  it("renders PayPal instead of a Donate link by default", () => {
    render(<CoreHeader />);

    expect(
      screen.getByRole("link", { name: "Donate with PayPal" }),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Donate" })).toBeNull();
  });

  it("can hide PayPal when showPayPal is false", () => {
    render(<CoreHeader showPayPal={false} />);

    expect(
      screen.queryByRole("link", { name: "Donate with PayPal" }),
    ).toBeNull();
  });
});

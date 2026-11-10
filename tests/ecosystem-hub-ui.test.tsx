/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/components/marketing/MapAbleCareMarketingShell", () => ({
  MapAbleCareMarketingShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import MapAbleEcosystemPage from "@/app/ecosystem/page";

afterEach(() => cleanup());

describe("ecosystem hub UI", () => {
  it("renders primary service choices and assurance copy", () => {
    render(<MapAbleEcosystemPage />);
    expect(
      screen.getByRole("heading", {
        name: /Your life\. Connected services\. Your decisions\./i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: /Primary MapAble services/i }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: /^Explore$/i }).getAttribute("href")).toBe(
      "/accessibility-map",
    );
    expect(
      screen.getByRole("link", { name: /^Marketplace$/i }).getAttribute("href"),
    ).toBe("/marketplace");
    expect(screen.getByText(/My Day \(planned\)/i)).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /What this hub does not do/i }),
    ).toBeTruthy();
  });
});

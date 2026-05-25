/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/participant",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href: string }> & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { navigationForRole } from "@/lib/navigation/role-navigation";

describe("P0 app shell accessibility", () => {
  it("defines skip target id used by shells", () => {
    expect(navigationForRole("participant").length).toBeGreaterThan(0);
  });

  it("participant nav includes Find and Bookings", () => {
    const labels = navigationForRole("participant").map((n) => n.label);
    expect(labels).toContain("Find");
    expect(labels).toContain("Bookings");
  });

  it("provider nav includes Jobs for roster access", () => {
    const labels = navigationForRole("provider_admin").map((n) => n.label);
    expect(labels).toContain("Jobs");
  });
});

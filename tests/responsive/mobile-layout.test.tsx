/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/participant",
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { role: "participant" } },
  }),
}));

afterEach(() => cleanup());

describe("MobileBottomNav", () => {
  it("renders bottom nav with accessible names", () => {
    render(<MobileBottomNav />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Home" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Find" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Bookings" })).toBeTruthy();
  });

  it("marks active route with aria-current", () => {
    render(<MobileBottomNav />);
    const homes = screen.getAllByRole("link", { name: "Home" });
    expect(homes[0]?.getAttribute("aria-current")).toBe("page");
  });
});

describe("role navigation", () => {
  it("changes tabs for support worker", async () => {
    const { mobileNavForRole } = await import(
      "@/lib/navigation/role-navigation"
    );
    const items = mobileNavForRole("support_worker");
    expect(items.map((i) => i.label)).toEqual([
      "Today",
      "Shifts",
      "Messages",
      "Notes",
      "More",
    ]);
  });
});

describe("ProviderResultCard", () => {
  it("shows sponsored label", async () => {
    const { ProviderResultCard } = await import(
      "@/components/providers/ProviderResultCard"
    );
    render(
      <ProviderResultCard
        name="Test Provider"
        suburb="Sydney"
        sponsored
      />
    );
    expect(screen.getByText("Sponsored")).toBeTruthy();
  });
});

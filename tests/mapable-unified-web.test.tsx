/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import UnifiedPage from "@/app/(marketing)/unified/page";
import { MAPABLE_UNIFIED_APP_ORIGIN } from "@/lib/config/mapable-unified";
import {
  buildContentSecurityPolicyEnforce,
  buildContentSecurityPolicyReportOnly,
} from "@/lib/security/headers";

afterEach(cleanup);

describe("MapAble Unified web integration", () => {
  it("offers first-party workflows, direct sign-in and an on-demand Replit preview", async () => {
    render(await UnifiedPage({ searchParams: Promise.resolve({}) }));
    expect(
      screen
        .getByRole("button", { name: "Preview app here" })
        .closest("form")
        ?.getAttribute("method"),
    ).toBe("get");
    expect(screen.queryByTitle("MapAble Unified on Replit")).toBeNull();
    const direct = screen.getByRole("link", {
      name: /Open full Replit app/,
    });
    expect(direct.getAttribute("href")).toBe(MAPABLE_UNIFIED_APP_ORIGIN);
    expect(direct.getAttribute("rel")).toContain("noreferrer");
    expect(
      screen
        .getByRole("link", { name: "My website transport trips" })
        .getAttribute("href"),
    ).toBe("/dashboard/transport");
    for (const [label, href] of [
      ["Request accessible transport", "/transport/request"],
      ["My website care bookings", "/care/bookings"],
      ["My worker shifts and offers", "/worker/today"],
      ["Explore employment", "/employment"],
    ]) {
      expect(
        screen.getByRole("link", { name: label }).getAttribute("href"),
      ).toBe(href);
    }
  });

  it("mounts the published app in a named frame and keeps a way out", async () => {
    render(await UnifiedPage({ searchParams: Promise.resolve({ open: "1" }) }));
    const frame = screen.getByTitle("MapAble Unified on Replit");
    expect(frame.getAttribute("src")).toBe(MAPABLE_UNIFIED_APP_ORIGIN);
    expect(frame.getAttribute("sandbox")?.split(" ").sort()).toEqual([
      "allow-forms",
      "allow-same-origin",
      "allow-scripts",
    ]);
    expect(frame.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(
      screen.getByRole("button", { name: "Close app preview" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Skip the app preview" })
        .getAttribute("href"),
    ).toBe("#website-dashboard");
  });

  it("accepts only the explicit launch value", async () => {
    render(
      await UnifiedPage({
        searchParams: Promise.resolve({ open: ["1", "2"] }),
      }),
    );
    expect(screen.queryByTitle("MapAble Unified on Replit")).toBeNull();
  });

  it("limits the Replit origin to frame-src on the Unified document in both policies", () => {
    for (const policy of [
      buildContentSecurityPolicyReportOnly,
      (pathname: string) =>
        buildContentSecurityPolicyEnforce("test", { pathname }),
    ]) {
      const csp = policy("/unified");
      const matching = csp
        .split("; ")
        .filter((directive) => directive.includes(MAPABLE_UNIFIED_APP_ORIGIN));
      expect(matching).toHaveLength(1);
      expect(matching[0]).toMatch(/^frame-src /);
      expect(csp).toContain("frame-ancestors 'none'");
      for (const path of [
        "/",
        "/dashboard/transport",
        "/unified-other",
        "/embed",
      ]) {
        expect(policy(path)).not.toContain(MAPABLE_UNIFIED_APP_ORIGIN);
      }
    }
  });
});

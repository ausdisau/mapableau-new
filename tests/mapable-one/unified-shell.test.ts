/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OneActionCentre } from "@/components/mapable-one/OneActionCentre";
import { OneStatus } from "@/components/mapable-one/OneStatus";
import { OneWorkspaceSwitcher } from "@/components/mapable-one/OneWorkspaceSwitcher";
import {
  buildCoreActionCentre,
  buildProviderActionCentre,
  buildWorkerActionCentre,
} from "@/lib/mapable-one/action-centre";
import { resolveOneShellChrome } from "@/lib/mapable-one/shell-nav";
import { mapableOneColors } from "@mapable/ui";

afterEach(() => {
  cleanup();
  delete process.env.MAPABLE_ONE_UNIFIED_SHELL_ENABLED;
  delete process.env.NEXT_PUBLIC_MAPABLE_ONE_UNIFIED_SHELL;
  vi.resetModules();
});

describe("mapable one flag fail-closed", () => {
  it("defaults off", async () => {
    const { isMapAbleOneUnifiedShellEnabled } = await import(
      "@/lib/config/mapable-one-shell"
    );
    expect(isMapAbleOneUnifiedShellEnabled()).toBe(false);
  });

  it("enables when server flag is true", async () => {
    process.env.MAPABLE_ONE_UNIFIED_SHELL_ENABLED = "true";
    const { isMapAbleOneUnifiedShellEnabled } = await import(
      "@/lib/config/mapable-one-shell"
    );
    expect(isMapAbleOneUnifiedShellEnabled()).toBe(true);
  });
});

describe("provisional tokens", () => {
  it("exposes navy orange purple without replacing legacy mapableColors keys", () => {
    expect(mapableOneColors.ink).toBe("#091C40");
    expect(mapableOneColors.orange).toBe("#FF7A00");
    expect(mapableOneColors.purple).toBe("#7047C6");
  });
});

describe("action centre projections", () => {
  it("provider unavailable without organisation", () => {
    const p = buildProviderActionCentre(null);
    expect(p.state).toBe("unavailable");
    expect(p.items).toHaveLength(0);
  });

  it("provider empty when metrics are zero", () => {
    const p = buildProviderActionCentre({
      organisationName: "Acme Supports",
      openCareRequests: 0,
      unassignedShifts72h: 0,
      pendingInvites: 0,
      onboardingBlockerCount: 0,
    });
    expect(p.state).toBe("empty");
  });

  it("worker unavailable without profile", () => {
    const p = buildWorkerActionCentre({
      profileLinked: false,
      todayShiftCount: 0,
      awaitingOfferCount: 0,
    });
    expect(p.state).toBe("unavailable");
  });

  it("core empty when no bookings", () => {
    const p = buildCoreActionCentre({
      hasBookingsToday: false,
      hasTransportToday: false,
      bookingCount: 0,
    });
    expect(p.state).toBe("empty");
  });
});

describe("workspace switcher honesty", () => {
  it("marks inaccessible workspaces as not available", () => {
    render(
      React.createElement(OneWorkspaceSwitcher, {
        current: "core",
        workspaces: [
          {
            id: "core",
            label: "MapAble Core",
            href: "/dashboard",
            available: true,
          },
          {
            id: "provider",
            label: "MapAble Provider",
            href: "/provider",
            available: false,
            reason: "Not available — requires membership.",
          },
        ],
      })
    );
    expect(screen.getByText("Not available")).toBeTruthy();
    expect(screen.getByText("MapAble Provider").closest("a")).toBeNull();
  });
});

describe("status is not colour-only", () => {
  it("includes text label and sr-only tone", () => {
    const { container } = render(
      React.createElement(OneStatus, {
        tone: "critical",
        label: "Roster gap",
      })
    );
    expect(screen.getByText("Roster gap")).toBeTruthy();
    expect(container.textContent).toMatch(/Critical/i);
  });
});

describe("action centre empty UI", () => {
  it("renders unavailable copy", () => {
    render(
      React.createElement(OneActionCentre, {
        projection: {
          state: "unavailable",
          items: [],
          message: "Link your organisation.",
        },
      })
    );
    expect(screen.getByText("Not available")).toBeTruthy();
    expect(screen.getByText(/Link your organisation/i)).toBeTruthy();
  });
});

describe("platform shell chrome map", () => {
  it("resolves every major portal header to One chrome", () => {
    for (const title of [
      "Provider",
      "Worker",
      "Driver",
      "Employer",
      "Admin",
      "Plan manager",
      "Support coordinator",
      "Messages",
      "Billing Centre",
      "Government partner",
    ]) {
      const chrome = resolveOneShellChrome(title);
      expect(chrome.navLinks.length).toBeGreaterThan(0);
      expect(chrome.workspaceLabel.length).toBeGreaterThan(0);
    }
  });
});

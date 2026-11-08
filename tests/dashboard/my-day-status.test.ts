import { describe, expect, it } from "vitest";

import {
  buildMyDaySnapshot,
  mapCareStatus,
  mapTransportStatus,
} from "@/lib/dashboard/my-day-status";
import {
  flattenParticipantNavLinks,
  isNavLinkActive,
  LEGACY_DASHBOARD_DEEP_LINKS,
  PARTICIPANT_NAV_GROUPS,
} from "@/lib/dashboard/participant-nav";

describe("my day status mapping", () => {
  it("maps care and transport statuses deterministically", () => {
    expect(mapCareStatus("accepted")).toBe("confirmed");
    expect(mapCareStatus("pending_provider")).toBe("pending");
    expect(mapCareStatus("cancelled")).toBe("cancelled");
    expect(mapTransportStatus("requested")).toBe("pending");
    expect(mapTransportStatus("en_route_to_pickup")).toBe("confirmed");
    expect(mapTransportStatus("cancelled")).toBe("cancelled");
  });

  it("does not fabricate activities when empty", () => {
    const snapshot = buildMyDaySnapshot({ care: [], transport: [] });
    expect(snapshot.empty).toBe(true);
    expect(snapshot.nearestConfirmed).toBeNull();
    expect(snapshot.pendingActions).toEqual([]);
    expect(snapshot.source).toBe("programmatic");
  });

  it("surfaces pending transport without calling it booked", () => {
    const snapshot = buildMyDaySnapshot({
      care: [],
      transport: [
        {
          id: "t1",
          status: "requested",
          scheduledStart: new Date("2030-01-02T10:00:00.000Z"),
        },
      ],
    });
    expect(snapshot.pendingActions).toHaveLength(1);
    expect(snapshot.pendingActions[0]?.certaintyNote).toMatch(/not described as booked/i);
    expect(snapshot.nearestConfirmed).toBeNull();
  });

  it("keeps cancelled care separate from transport", () => {
    const snapshot = buildMyDaySnapshot({
      now: new Date("2030-01-01T00:00:00.000Z"),
      care: [
        {
          id: "c1",
          status: "cancelled",
          title: "Morning support",
          scheduledStartAt: new Date("2030-01-01T09:00:00.000Z"),
        },
      ],
      transport: [
        {
          id: "t1",
          status: "accepted",
          scheduledStart: new Date("2030-01-01T11:00:00.000Z"),
        },
      ],
    });
    expect(snapshot.careSummary.status).toBe("cancelled");
    expect(snapshot.nearestConfirmed?.kind).toBe("transport");
    expect(snapshot.careSummary.label).toMatch(/Cancelled/i);
  });
});

describe("participant nav config", () => {
  it("groups expected sections with real hrefs", () => {
    expect(PARTICIPANT_NAV_GROUPS.map((g) => g.id)).toEqual([
      "your-life",
      "your-information",
      "choice-safety",
    ]);
    const hrefs = flattenParticipantNavLinks().map((l) => l.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/dashboard/safety");
    expect(hrefs).toContain("/dashboard/consent");
    expect(hrefs.every((href) => href.startsWith("/"))).toBe(true);
  });

  it("marks home active only on exact dashboard path", () => {
    expect(
      isNavLinkActive("/dashboard", { href: "/dashboard", exact: true }),
    ).toBe(true);
    expect(
      isNavLinkActive("/dashboard/profile", {
        href: "/dashboard",
        exact: true,
      }),
    ).toBe(false);
  });

  it("preserves legacy deep links list", () => {
    expect(LEGACY_DASHBOARD_DEEP_LINKS).toContain("/dashboard/profile");
    expect(LEGACY_DASHBOARD_DEEP_LINKS).toContain("/care");
  });
});

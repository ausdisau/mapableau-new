import { describe, expect, it } from "vitest";

import {
  buildAttention,
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

describe("buildAttention", () => {
  it("returns neutral empty attention without fabricating schedules", () => {
    const attention = buildAttention(
      buildMyDaySnapshot({ care: [], transport: [] }),
    );
    expect(attention.level).toBe("neutral");
    expect(attention.primaryHref).toBe("/dashboard/find-support");
    expect(attention.title).toMatch(/Nothing scheduled/i);
  });

  it("prioritises cancelled care and does not rewrite transport", () => {
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
    const attention = buildAttention(snapshot);
    expect(attention.level).toBe("bad");
    expect(attention.statusLabel).toMatch(/Review care/i);
    expect(attention.description).toMatch(/remain confirmed/i);
    expect(attention.primaryHref).toBe("/care/bookings");
  });

  it("warns on pending transport without calling it booked", () => {
    const attention = buildAttention(
      buildMyDaySnapshot({
        care: [
          {
            id: "c1",
            status: "accepted",
            scheduledStartAt: new Date("2030-01-02T09:00:00.000Z"),
          },
        ],
        transport: [
          {
            id: "t1",
            status: "requested",
            scheduledStart: new Date("2030-01-02T10:30:00.000Z"),
          },
        ],
      }),
    );
    expect(attention.level).toBe("warn");
    expect(attention.title).toMatch(/awaiting confirmation/i);
    expect(attention.description).toMatch(/not treat this trip as booked/i);
    expect(attention.primaryHref).toBe("/dashboard/transport");
  });

  it("returns ok for routine confirmed arrangements", () => {
    const attention = buildAttention(
      buildMyDaySnapshot({
        now: new Date("2030-01-01T00:00:00.000Z"),
        care: [
          {
            id: "c1",
            status: "accepted",
            scheduledStartAt: new Date("2030-01-01T09:00:00.000Z"),
          },
        ],
        transport: [
          {
            id: "t1",
            status: "accepted",
            scheduledStart: new Date("2030-01-01T10:30:00.000Z"),
          },
        ],
      }),
    );
    expect(attention.level).toBe("ok");
    expect(attention.statusLabel).toMatch(/Everything confirmed/i);
    expect(attention.primaryLabel).toMatch(/View my plan/i);
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
    const labels = flattenParticipantNavLinks().map((l) => l.label);
    expect(labels).toContain("My Care & Support");
    expect(labels).toContain("My Transport");
    expect(labels).toContain("Bookings & Calendar");
    expect(labels).toContain("Privacy, Consent & Delegates");
    expect(labels).toContain("Account & Security");
    expect(labels).toContain("Help & Safety");
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

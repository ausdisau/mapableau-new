/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TransportTripsPage from "@/app/dashboard/transport/page";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  listTransportTripCards,
  tripListScope,
} from "@/lib/transport/transport-trip-list";

const mock = vi.hoisted(() => ({
  auth: vi.fn(),
  trips: vi.fn(),
  driver: vi.fn(),
  orgIds: vi.fn(),
  access: vi.fn(),
}));
vi.mock("@/lib/auth/guards", () => ({ requireAuth: mock.auth }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    transportTrip: { findMany: mock.trips },
    transportDriver: { findFirst: mock.driver },
  },
}));
vi.mock("@/lib/api/organisation-scope", () => ({
  getUserOrganisationIds: mock.orgIds,
}));
vi.mock("@/lib/transport/transport-access-policy", () => ({
  resolveTripAccess: mock.access,
}));

const user: CurrentUser = {
  id: "fixture",
  email: "fixture@example.invalid",
  name: "Fixture",
  phone: null,
  locale: "en-AU",
  timezone: "Australia/Sydney",
  roles: ["participant"],
  primaryRole: "participant",
};
const row = {
  id: "trip",
  status: "requested",
  participantId: user.id,
  providerOrganisationId: null,
  scheduledStart: new Date("2026-11-12T00:00:00Z"),
  pickupSuburb: "West",
  dropoffSuburb: "East",
  pickupAddress: "Private pickup",
  dropoffAddress: "Private drop-off",
};

beforeEach(() => {
  vi.resetAllMocks();
  mock.auth.mockResolvedValue(user);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("signed-in transport dashboard", () => {
  it("reads only list fields and honours the address access decision for each row", async () => {
    mock.trips.mockResolvedValue([
      row,
      { ...row, id: "summary" },
      { ...row, id: "hidden" },
    ]);
    mock.access
      .mockResolvedValueOnce("exact")
      .mockResolvedValueOnce("summary")
      .mockResolvedValueOnce("none");
    const cards = await listTransportTripCards(user);
    const args = mock.trips.mock.calls[0][0];
    expect(args.where).toEqual({ participantId: user.id });
    expect(args.select).not.toHaveProperty("accessNotes");
    expect(args.select).not.toHaveProperty("handoverRecords");
    expect(cards.map((card) => card.id)).toEqual(["trip", "summary"]);
    expect(cards[0].pickup.address).toBe(row.pickupAddress);
    expect(cards[1].pickup.address).toBeUndefined();
    expect(cards[1].dropoff.address).toBeUndefined();
  });

  it("keeps driver assignments and organisation memberships scoped", async () => {
    mock.driver
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "driver" });
    const driver = { ...user, primaryRole: "driver" as const };
    expect(await tripListScope(driver)).toEqual({ id: { in: [] } });
    expect(await tripListScope(driver)).toEqual({
      dispatchAssignments: { some: { active: true, driverId: "driver" } },
    });
    mock.orgIds.mockResolvedValue(["org"]);
    expect(
      await tripListScope({ ...user, primaryRole: "transport_operator" }),
    ).toEqual({ providerOrganisationId: { in: ["org"] } });
  });

  it("keeps the page usable when the trip store is unavailable", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mock.trips.mockRejectedValue(
      Object.assign(new Error("private query details"), { code: "P2021" }),
    );
    render(await TransportTripsPage());
    expect(
      screen.getByRole("heading", {
        name: /trip list is temporarily unavailable/,
      }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Reload trip list" })
        .closest("form")
        ?.getAttribute("action"),
    ).toBe("/dashboard/transport");
    expect(
      screen
        .getByRole("link", { name: "MapAble Unified" })
        .getAttribute("href"),
    ).toBe("/unified");
    expect(screen.queryByText("You have no transport trips yet.")).toBeNull();
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "private query details",
    );
  });

  it("distinguishes a successful empty query and preserves sign-in redirects", async () => {
    mock.trips.mockResolvedValue([]);
    render(await TransportTripsPage());
    expect(screen.getByRole("status").textContent).toContain(
      "no transport trips",
    );
    mock.auth.mockRejectedValueOnce(new Error("sign-in redirect"));
    await expect(TransportTripsPage()).rejects.toThrow("sign-in redirect");
    expect(mock.trips).toHaveBeenCalledTimes(1);
  });
});

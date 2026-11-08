import { beforeEach, describe, expect, it, vi } from "vitest";

import { alpacaTourismProvider, ALPACA_NOT_ENABLED_MESSAGE } from "@/lib/tourism/alpaca-provider";
import { mockTourismProvider } from "@/lib/tourism/mock-provider";
import { makeSydneyDemoTrip, planSydneyTrip } from "@/lib/tourism/planner";
import { SYDNEY_TOURISM_PLACES } from "@/lib/tourism/sydney-dataset";
import {
  addTourismStop,
  getTourismPlace,
  isTourismTrip,
  migrateTourismTrip,
  moveTourismStop,
  removeTourismStop,
} from "@/lib/tourism/trip-ops";
import { defaultPlannerInput, TOURISM_TRIP_STORAGE_KEY } from "@/lib/tourism/types";

describe("MapAble Tourism Sydney prototype", () => {
  it("records sources and never marks demo places independently verified", () => {
    expect(SYDNEY_TOURISM_PLACES).toHaveLength(6);
    for (const place of SYDNEY_TOURISM_PLACES) {
      expect(place.sourceUrl).toMatch(/^https:\/\//);
      expect(place.checkedOn).toBeTruthy();
      expect(place.photos[0]?.licence).toMatch(/prototype illustration/i);
      expect(place.features.stepFree.status).not.toBe("independently_verified");
      expect(place.features.toilets.status).not.toBe("independently_verified");
    }
    expect(getTourismPlace("sea-life")?.features.stepFree.status).toBe("requires_confirmation");
    expect(getTourismPlace("sea-life")?.stepFree.status).toBe("requires-confirmation");
  });

  it("defaults step-free and accessible toilets on, and does not infer from a disability label", () => {
    const defaults = defaultPlannerInput();
    expect(defaults.accessPrefs.stepFree).toBe(true);
    expect(defaults.accessPrefs.accessibleToilets).toBe(true);
    expect(defaults.accessPrefs.wheelchairTransport).toBe(false);
    const trip = planSydneyTrip(defaults);
    expect(trip.days[0].stops.some((stop) => stop.kind === "rest")).toBe(true);
    expect(
      trip.days[0].stops.some(
        (stop) => stop.kind === "transport" && stop.evidenceStatus === "unknown",
      ),
    ).toBe(true);
    expect(trip.days.map((day) => day.stopIds.length)).toEqual([2, 2, 2]);
  });

  it("creates an editable itinerary with rest and transport buffers", () => {
    const trip = makeSydneyDemoTrip();
    expect(isTourismTrip(trip)).toBe(true);
    expect(trip.days[0].stops.map((stop) => stop.kind)).toEqual([
      "attraction",
      "rest",
      "transport",
      "attraction",
    ]);
    const moved = moveTourismStop(trip, 1, "mca", 2);
    expect(moved.days[0].stopIds).toEqual(["opera"]);
    expect(trip.days[0].stopIds).toContain("mca");
    const reordered = moveTourismStop(trip, 1, "mca", 1, 3);
    expect(reordered.days[0].stopIds).toEqual(["opera", "mca"]);
    expect(removeTourismStop(trip, "mca").days[0].stopIds).toEqual(["opera"]);
    expect(addTourismStop(removeTourismStop(trip, "mca"), "mca", 3).days[2].stopIds).toContain("mca");
  });

  it("rejects unknown stop ids and migrates legacy stopIds storage", () => {
    const trip = makeSydneyDemoTrip();
    expect(addTourismStop(trip, "not-a-place", 1)).toBe(trip);
    expect(
      isTourismTrip({
        id: "sydney-demo",
        destination: "Sydney",
        createdFrom: "local-demo",
        days: [{ day: 1, title: "Bad", stopIds: ["not-a-place"] }],
      }),
    ).toBe(false);
    const legacy = {
      id: "sydney-demo",
      destination: "Sydney",
      createdFrom: "local-demo",
      days: [{ day: 1, title: "Harbour", stopIds: ["mca", "opera"] }],
    };
    const migrated = migrateTourismTrip(legacy);
    expect(migrated?.days[0].stops.every((stop) => stop.kind === "attraction")).toBe(true);
    expect(migrated?.days[0].stopIds).toEqual(["mca", "opera"]);
  });

  it("exposes a mock provider and an Alpaca stub that does not fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(mockTourismProvider.isMock).toBe(true);
    const places = await mockTourismProvider.listPlaces();
    expect(places).toHaveLength(6);
    await expect(alpacaTourismProvider.listPlaces()).rejects.toThrow(ALPACA_NOT_ENABLED_MESSAGE);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("tourism storage key", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the documented localStorage key", () => {
    expect(TOURISM_TRIP_STORAGE_KEY).toBe("mapable-tourism-sydney-demo-v1");
  });
});

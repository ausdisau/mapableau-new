import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearTfnswClientCache } from "@/lib/tfnsw/client";
import { parseTfnswTripPlan } from "@/lib/tfnsw/trip-planner-parse";
import { planTrip, planTripFromCoordinates } from "@/lib/tfnsw/trip-planner-service";

describe("TfNSW trip planner", () => {
  beforeEach(() => {
    vi.stubEnv("TFNSW_API_KEY", "test-key");
    vi.stubEnv("TFNSW_TRIP_PLANNER_ENABLED", "true");
    clearTfnswClientCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearTfnswClientCache();
  });

  it("planTrip calls /v1/tp/trip with wheelchair options", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        journeys: [
          {
            duration: 1800,
            legs: [
              {
                product: [{ name: "Train" }],
                origin: { name: "Central" },
                destination: { name: "Town Hall" },
                duration: 600,
              },
            ],
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await planTrip({
      typeOrigin: "any",
      nameOrigin: "10111010",
      typeDestination: "any",
      nameDestination: "10101100",
      wheelchair: true,
    });

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/v1/tp/trip");
    expect(url).toContain("wheelchair=1");
    expect(url).toContain("itOptionsActive=1");
  });

  it("planTripFromCoordinates uses coord origin and destination", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ journeys: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await planTripFromCoordinates({
      origin: { lat: -33.87, lng: 151.21 },
      destination: { lat: -33.88, lng: 151.22 },
    });

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("type_origin=coord");
    expect(url).toContain("type_destination=coord");
  });

  it("parseTfnswTripPlan normalizes journeys", () => {
    const plan = parseTfnswTripPlan({
      journeys: [
        {
          duration: 1200,
          legs: [
            {
              product: { name: "Bus" },
              origin: { name: "Stop A" },
              destination: { name: "Stop B" },
              duration: 600,
              transportation: { number: "400" },
            },
          ],
        },
      ],
    });

    expect(plan.jurisdiction).toBe("NSW");
    expect(plan.options).toHaveLength(1);
    expect(plan.options[0]?.legs[0]?.mode).toBe("Bus");
    expect(plan.options[0]?.legs[0]?.routeNumber).toBe("400");
  });
});

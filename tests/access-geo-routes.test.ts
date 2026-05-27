import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/access-map/access-geocoding-service", () => ({
  isAccessGeocodingAvailable: vi.fn(),
  accessGeoAutocomplete: vi.fn(),
  accessGeoResolvePlace: vi.fn(),
}));

import { GET as autocompleteGet } from "@/app/api/access/geo/autocomplete/route";
import { GET as statusGet } from "@/app/api/access/geo/status/route";
import {
  accessGeoAutocomplete,
  isAccessGeocodingAvailable,
} from "@/lib/access-map/access-geocoding-service";

describe("access geo API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("status reports enabled flag", async () => {
    vi.mocked(isAccessGeocodingAvailable).mockReturnValue(true);
    const res = await statusGet();
    const body = await res.json();
    expect(body.enabled).toBe(true);
    expect(body.provider).toBe("amazon-location");
  });

  it("autocomplete returns 503 when geocoding disabled", async () => {
    vi.mocked(isAccessGeocodingAvailable).mockReturnValue(false);
    const res = await autocompleteGet(
      new Request("http://localhost/api/access/geo/autocomplete?q=Sydney")
    );
    expect(res.status).toBe(503);
  });

  it("autocomplete returns suggestions", async () => {
    vi.mocked(isAccessGeocodingAvailable).mockReturnValue(true);
    vi.mocked(accessGeoAutocomplete).mockResolvedValue([
      { placeId: "p1", label: "Sydney NSW" },
    ]);

    const res = await autocompleteGet(
      new Request("http://localhost/api/access/geo/autocomplete?q=Sydney")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions).toHaveLength(1);
  });
});

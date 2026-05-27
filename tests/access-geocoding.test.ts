import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/amazon-location/geo-places-client", () => ({
  amazonAutocomplete: vi.fn(),
  amazonGeocode: vi.fn(),
  amazonGetPlace: vi.fn(),
  amazonReverseGeocode: vi.fn(),
  parseAmazonAddress: vi.fn(
    (address?: {
      Label?: string;
      Locality?: string;
      Region?: { Name?: string };
    }) => ({
      label: address?.Label ?? "",
      suburb: address?.Locality,
      stateOrRegion: address?.Region?.Name,
      country: "AU",
    })
  ),
  positionToLatLng: vi.fn((pos?: number[]) =>
    pos ? { latitude: pos[1], longitude: pos[0] } : null
  ),
}));

vi.mock("@/lib/amazon-location/config", () => ({
  isAmazonLocationEnabled: vi.fn(() => true),
  getAmazonLocationConfig: vi.fn(),
}));

import {
  accessGeoAutocomplete,
  accessGeoEnrichCreateInput,
  accessGeoResolvePlace,
  isAccessGeocodingAvailable,
} from "@/lib/access-map/access-geocoding-service";
import {
  amazonAutocomplete,
  amazonGeocode,
  amazonGetPlace,
} from "@/lib/amazon-location/geo-places-client";
import { isAmazonLocationEnabled } from "@/lib/amazon-location/config";

describe("access geocoding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAmazonLocationEnabled).mockReturnValue(true);
  });

  it("reports availability from config", () => {
    expect(isAccessGeocodingAvailable()).toBe(true);
  });

  it("maps autocomplete results to suggestions with Address.Label", async () => {
    vi.mocked(amazonAutocomplete).mockResolvedValue([
      {
        PlaceId: "place-1",
        Title: "Wrong Title Order",
        Address: { Label: "123 George St, Sydney NSW 2000" },
      },
    ]);

    const suggestions = await accessGeoAutocomplete("123 Geo");
    expect(suggestions[0]?.label).toBe("123 George St, Sydney NSW 2000");
    expect(suggestions[0]?.placeId).toBe("place-1");
  });

  it("resolves place details with coordinates", async () => {
    vi.mocked(amazonGetPlace).mockResolvedValue({
      PlaceId: "place-1",
      Address: { Label: "123 George St, Sydney NSW 2000", Locality: "Sydney" },
      Position: [151.2093, -33.8688],
    });

    const place = await accessGeoResolvePlace("place-1");
    expect(place?.latitude).toBe(-33.8688);
    expect(place?.longitude).toBe(151.2093);
    expect(place?.suburb).toBe("Sydney");
  });

  it("enriches create input when coordinates are missing", async () => {
    vi.mocked(amazonGeocode).mockResolvedValue([
      {
        PlaceId: "place-2",
        Address: { Label: "1 Test St, Adelaide SA 5000" },
        Position: [138.6, -34.9],
      },
    ]);

    const enriched = await accessGeoEnrichCreateInput({
      addressText: "1 Test St",
      suburb: "Adelaide",
      stateOrRegion: "SA",
      latitude: 0,
      longitude: 0,
    });

    expect(enriched.latitude).toBe(-34.9);
    expect(enriched.longitude).toBe(138.6);
  });
});

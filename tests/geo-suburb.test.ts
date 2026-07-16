import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  abbreviateAustralianState,
  extractAustralianSuburb,
  formatLocationLabel,
  getUserSuburb,
  reverseGeocode,
  type NominatimAddress,
} from "@/lib/geo";

describe("extractAustralianSuburb", () => {
  it("prefers suburb over other locality fields", () => {
    const address: NominatimAddress = {
      suburb: "Parramatta",
      city: "Sydney",
      town: "Townsville",
      village: "Village",
      locality: "Locality",
      municipality: "Municipality",
    };
    expect(extractAustralianSuburb(address)).toBe("Parramatta");
  });

  it("falls back through AU-friendly locality order", () => {
    expect(
      extractAustralianSuburb({
        city: "Ballarat",
        town: "Town",
        village: "Village",
      }),
    ).toBe("Ballarat");
    expect(
      extractAustralianSuburb({
        town: "Katoomba",
        village: "Village",
      }),
    ).toBe("Katoomba");
    expect(extractAustralianSuburb({ village: "St Ives" })).toBe("St Ives");
    expect(extractAustralianSuburb({ locality: "Locality" })).toBe("Locality");
    expect(extractAustralianSuburb({ municipality: "Council" })).toBe("Council");
    expect(extractAustralianSuburb({ state_district: "District" })).toBe(
      "District",
    );
  });

  it("returns empty string when no suburb-like field exists", () => {
    expect(extractAustralianSuburb({ postcode: "2000", state: "NSW" })).toBe(
      "",
    );
  });
});

describe("abbreviateAustralianState", () => {
  it("normalizes full state names to abbreviations", () => {
    expect(abbreviateAustralianState("New South Wales")).toBe("NSW");
    expect(abbreviateAustralianState("Victoria")).toBe("VIC");
  });

  it("keeps existing abbreviations uppercase", () => {
    expect(abbreviateAustralianState("nsw")).toBe("NSW");
    expect(abbreviateAustralianState("ACT")).toBe("ACT");
  });
});

describe("formatLocationLabel", () => {
  it("formats suburb, state, and postcode", () => {
    expect(
      formatLocationLabel({
        suburb: "St Ives",
        state: "New South Wales",
        postcode: "2075",
      }),
    ).toBe("St Ives NSW 2075");
  });

  it("formats suburb and state without postcode", () => {
    expect(
      formatLocationLabel({
        suburb: "Parramatta",
        state: "NSW",
        postcode: "",
      }),
    ).toBe("Parramatta NSW");
  });

  it("falls back to postcode and state when suburb is missing", () => {
    expect(
      formatLocationLabel({
        suburb: "",
        state: "NSW",
        postcode: "2150",
      }),
    ).toBe("2150 NSW");
  });

  it("falls back to suburb and postcode when state is missing", () => {
    expect(
      formatLocationLabel({
        suburb: "Parramatta",
        state: "",
        postcode: "2150",
      }),
    ).toBe("Parramatta 2150");
  });
});

describe("reverseGeocode", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps Nominatim address fields into suburb, state, and postcode", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          suburb: "Parramatta",
          postcode: "2150",
          state: "New South Wales",
        },
        display_name: "Parramatta, NSW, Australia",
      }),
    } as Response);

    const result = await reverseGeocode(-33.8148, 151.0033);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result).toEqual({
      postcode: "2150",
      suburb: "Parramatta",
      state: "NSW",
      displayName: "Parramatta, NSW, Australia",
    });
  });
});

describe("getUserSuburb", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns formatted suburb label from browser position and reverse geocode", async () => {
    const geolocation = {
      getCurrentPosition: vi.fn((success: PositionCallback) => {
        success({
          coords: { latitude: -33.8148, longitude: 151.0033 },
        } as GeolocationPosition);
      }),
    };
    vi.stubGlobal("navigator", { geolocation });

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          suburb: "Parramatta",
          postcode: "2150",
          state: "NSW",
        },
        display_name: "Parramatta, NSW, Australia",
      }),
    } as Response);

    const result = await getUserSuburb();

    expect(result).toEqual({
      position: { lat: -33.8148, lng: 151.0033 },
      suburb: "Parramatta",
      state: "NSW",
      postcode: "2150",
      label: "Parramatta NSW 2150",
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  hasValidCoordinates,
  normalizeProviderOutlet,
  parseNdisProviderJson,
} from "@/lib/ndis-provider-ingest/normalize";

describe("NDIS provider ingest normalize", () => {
  it("parses bundle shape with data array", () => {
    const bundle = parseNdisProviderJson({
      date: "30 January 2026",
      data: [
        {
          ABN: "12345678901",
          Prov_N: "Test Provider",
          Head_Office: "Sydney NSW 2000",
          Outletname: "Test Outlet",
          Flag: "O",
          Active: 1,
          Phone: "02 9000 0000",
          Website: "",
          Email: "a@example.com",
          Address: "1 George St, Sydney, NSW 2000",
          State_cd: "NSW",
          Post_cd: 2000,
          Latitude: -33.87,
          Longitude: 151.21,
          RegGroup: [3, 4],
          Post_cd_p: "",
          opnhrs: "",
          prfsn: "Occupational Therapist",
        },
      ],
    });
    expect(bundle.data).toHaveLength(1);
    expect(bundle.data[0]?.Prov_N).toBe("Test Provider");
  });

  it("rejects invalid state", () => {
    expect(
      normalizeProviderOutlet({ State_cd: "XX", ABN: "1", Prov_N: "X" }),
    ).toBeNull();
  });

  it("detects valid Australian coordinates", () => {
    expect(
      hasValidCoordinates({
        ABN: "1",
        Prov_N: "X",
        Head_Office: "",
        Outletname: "",
        Flag: "O",
        Active: 1,
        Phone: "",
        Website: "",
        Email: "",
        Address: "",
        State_cd: "NSW",
        Post_cd: 2000,
        Latitude: -33.87,
        Longitude: 151.21,
        RegGroup: [],
        Post_cd_p: "",
        opnhrs: "",
        prfsn: "",
      }),
    ).toBe(true);
    expect(
      hasValidCoordinates({
        ABN: "1",
        Prov_N: "X",
        Head_Office: "",
        Outletname: "",
        Flag: "O",
        Active: 1,
        Phone: "",
        Website: "",
        Email: "",
        Address: "",
        State_cd: "NSW",
        Post_cd: 2000,
        Latitude: 0,
        Longitude: 0,
        RegGroup: [],
        Post_cd_p: "",
        opnhrs: "",
        prfsn: "",
      }),
    ).toBe(false);
  });
});

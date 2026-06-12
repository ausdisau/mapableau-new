import { describe, expect, it } from "vitest";

import type { ProviderOutlet } from "@/data/provider-outlets.types";
import { mapOutletToProvider } from "@/lib/map/mappers/provider-outlet";

const sampleOutlet: ProviderOutlet = {
  ABN: "12345678901",
  Prov_N: "Harbour Support Co.",
  Head_Office: "Parramatta NSW 2150",
  Outletname: "Harbour Support Co.",
  Flag: "O",
  Active: 1,
  Phone: "",
  Website: "",
  Email: "",
  Address: "1 George St, Parramatta NSW 2150",
  State_cd: "NSW",
  Post_cd: 2150,
  Latitude: -33.81,
  Longitude: 151.0,
  RegGroup: [4, 5, 29],
  Post_cd_p: "",
  opnhrs: "",
  prfsn: "Occupational Therapy|Support Worker",
};

describe("mapOutletToProvider", () => {
  it("includes classified support types and access need ids", () => {
    const provider = mapOutletToProvider(sampleOutlet, 0);
    expect(provider.supportTypes).toEqual([
      "personal-care",
      "transport",
      "therapy",
    ]);
    expect(provider.accessNeedIds).toEqual([]);
    expect(provider.registered).toBe(true);
    expect(provider.name).toBe("Harbour Support Co.");
  });
});

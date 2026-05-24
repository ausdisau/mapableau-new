import { describe, expect, it } from "vitest";

import { aggregateOutletsByAbn } from "@/lib/ndis-provider-import/aggregate";
import { normalizeAbn, stableProviderId } from "@/lib/ndis-provider-import/parse-location";
import type { ProviderOutlet } from "@/data/provider-outlets.types";

const sample: ProviderOutlet[] = [
  {
    ABN: "90666584907",
    Prov_N: "Test Provider Pty Ltd",
    Head_Office: "Duncraig WA 6023",
    Outletname: "Outlet A",
    Flag: "O",
    Active: 1,
    Phone: "08 9454 9416",
    Website: "https://example.com",
    Email: "a@example.com",
    Address: "1 Main St, Duncraig, WA 6023",
    State_cd: "WA",
    Post_cd: 6023,
    Latitude: -31.8,
    Longitude: 115.8,
    RegGroup: [3, 4],
    Post_cd_p: "",
    opnhrs: "",
    prfsn: "Disability Support Worker",
  },
  {
    ABN: "90666584907",
    Prov_N: "Test Provider Pty Ltd",
    Head_Office: "Duncraig WA 6023",
    Outletname: "Outlet B",
    Flag: "O",
    Active: 1,
    Phone: "08 9454 9416",
    Website: "https://example.com",
    Email: "a@example.com",
    Address: "2 Other St, Perth, WA 6000",
    State_cd: "WA",
    Post_cd: 6000,
    Latitude: -31.9,
    Longitude: 115.9,
    RegGroup: [5],
    Post_cd_p: "",
    opnhrs: "",
    prfsn: "",
  },
];

describe("ndis provider import", () => {
  it("normalizes ABN and builds stable ids", () => {
    expect(normalizeAbn("90 666 584 907")).toBe("90666584907");
    expect(stableProviderId("90666584907")).toBe("ndis-90666584907");
  });

  it("aggregates outlets by ABN", () => {
    const rows = aggregateOutletsByAbn(sample);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Test Provider Pty Ltd");
    expect(rows[0].ndisRegistered).toBe(true);
    expect(rows[0].locations.length).toBe(2);
    expect(rows[0].specialisations.length).toBeGreaterThan(0);
  });
});

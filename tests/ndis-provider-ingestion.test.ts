import { describe, expect, it } from "vitest";

import {
  buildStableSourceId,
  extractProviderRecords,
  normaliseNdisProviderRecord,
  sha256Hex,
} from "@/lib/ingestion/ndisProviders";

describe("NDIS provider ingestion core", () => {
  it("extracts nested data array", () => {
    const { records, sourceDate } = extractProviderRecords({
      date: "30 January 2026",
      data: [{ ABN: "1", Prov_N: "Test", State_cd: "NSW" }],
    });
    expect(records).toHaveLength(1);
    expect(sourceDate).toBe("30 January 2026");
  });

  it("extracts top-level array", () => {
    const { records } = extractProviderRecords([{ Prov_N: "A", State_cd: "VIC" }]);
    expect(records).toHaveLength(1);
  });

  it("normalises list-providers shaped row", () => {
    const row = normaliseNdisProviderRecord(
      {
        ABN: "12345678901",
        Prov_N: "Acme Supports",
        Outletname: "Acme Outlet",
        Address: "1 George St, Sydney, NSW 2000",
        State_cd: "NSW",
        Post_cd: 2000,
        Latitude: -33.87,
        Longitude: 151.21,
        Phone: "02 9000 0000",
        Email: "a@example.com",
        RegGroup: [3, 4],
        prfsn: "Occupational Therapist|Physiotherapist",
      },
      "https://example.com/data.json",
    );
    expect(row).not.toBeNull();
    expect(row?.providerName).toBe("Acme Supports");
    expect(row?.state).toBe("NSW");
    expect(row?.services).toContain("Occupational Therapist");
    expect(row?.registrationGroups).toEqual(["3", "4"]);
    expect(row?.sourceId).toMatch(/^abn:/);
  });

  it("does not require NDIS registration number at normalise time", () => {
    const row = normaliseNdisProviderRecord(
      { Prov_N: "No Reg Yet", State_cd: "QLD", Post_cd: 4000 },
      "https://example.com",
    );
    expect(row?.registrationNumber).toBeNull();
  });

  it("builds stable source_id from ABN", () => {
    const raw = { ABN: "111", Outletname: "Branch", Post_cd: 2000 };
    const id = buildStableSourceId(raw, {
      registrationNumber: null,
      abn: "111",
      providerName: "Org",
      address: null,
      postcode: "2000",
    });
    expect(id.startsWith("abn:111:")).toBe(true);
  });

  it("hashes payloads deterministically", () => {
    expect(sha256Hex("test")).toHaveLength(64);
    expect(sha256Hex("test")).toBe(sha256Hex("test"));
  });
});

describe("admin cron auth", () => {
  it("rejects missing bearer", async () => {
    const prev = process.env.ADMIN_CRON_SECRET;
    process.env.ADMIN_CRON_SECRET = "test-secret";
    const { POST } = await import(
      "@/app/api/admin/ingest/ndis-providers/route"
    );
    const res = await POST(
      new Request("http://localhost/api/admin/ingest/ndis-providers", {
        method: "POST",
      }),
    );
    expect(res.status).toBe(401);
    process.env.ADMIN_CRON_SECRET = prev;
  });
});

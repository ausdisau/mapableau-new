import { afterEach, describe, expect, it, vi } from "vitest";

import { PROVIDERS } from "@/app/provider-finder/providers";
import type { ProviderOutlet } from "@/data/provider-outlets.types";
import type { NdisProviderSearchRow } from "@/lib/ingestion/ndis-providers-search";
import { ndisRowToProvider } from "@/lib/map/mappers/ndis-provider";
import { mapOutletToProvider } from "@/lib/map/mappers/provider-outlet";
import { getProviderEvidence } from "@/lib/provider/finder/evidence";
import {
  buildNdisSearchParamsFromApplied,
  ndisRowToCopilotResult,
} from "@/lib/provider/finder/ndis-search-from-applied";
import { fetchProviderOutlets } from "@/lib/provider/finder/provider-outlets";
import type { SearchInterpretation } from "@/types/search";

function ndisRow(
  overrides: Partial<NdisProviderSearchRow> = {},
): NdisProviderSearchRow {
  return {
    source_id: "src-1",
    provider_name: "Example Supports",
    suburb: "Penrith",
    state: "NSW",
    postcode: "2750",
    latitude: null,
    longitude: null,
    phone: null,
    email: null,
    website: null,
    services: ["Disability Support Worker (includes Mental Health or Peer Worker)"],
    registration_groups: ["Daily Personal Activities"],
    updated_at: new Date("2026-01-30T00:00:00.000Z"),
    ...overrides,
  };
}

function interpretation(
  overrides: Partial<SearchInterpretation> = {},
): SearchInterpretation {
  return {
    sourceQuery: "morning daily activities around Penrith",
    parsed: true,
    configured: true,
    filters: {
      q: "morning daily activities around Penrith",
      location: "Penrith 2750",
      access: "text communication",
      service: "morning daily activities",
      provider: "",
    },
    serviceCategorySlug: "daily-life",
    serviceCategoryId: null,
    accessNeedIds: ["text-communication"],
    accessNeeds: { ids: ["text-communication"], confidence: 0.8, source: "keyword" },
    confidence: 0.8,
    engineId: "test",
    ...overrides,
  };
}

describe("provider finder truthfulness", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not concatenate suburb or service into provider-name FTS q", () => {
    const params = buildNdisSearchParamsFromApplied(
      {
        query: "morning daily activities around Penrith",
        location: "Penrith 2750",
        providerName: "",
        serviceQuery: "morning daily activities",
        accessQuery: "text communication",
        supportType: "personal-care",
        accessNeedIds: ["text-communication"],
      },
      interpretation(),
    );

    expect(params.q).toBeUndefined();
    expect(params.q ?? "").not.toMatch(/penrith/i);
    expect(params.q ?? "").not.toMatch(/daily activities/i);
    expect(params.suburb).toMatch(/penrith/i);
    expect(params.postcode).toBe("2750");
  });

  it("does not treat registration groups as live Commission registration", () => {
    const copilot = ndisRowToCopilotResult(ndisRow());
    expect(copilot.registered).toBe(false);
    expect(copilot.registrationStatus).toBe("groups_listed_in_import");
    expect(copilot.availability).toBe("unknown");
    expect(copilot.workerCredentials).toBe("unknown");
    expect(copilot.sourceType).toBe("ndis_import");
    expect(copilot.sourceId).toBe("src-1");

    const mapped = ndisRowToProvider(ndisRow());
    expect(mapped.registered).toBe(false);
    expect(mapped.source).toBe("ndis_import");

    const evidence = getProviderEvidence(mapped);
    expect(evidence.registration.toLowerCase()).not.toContain("verified profile");
    expect(evidence.registration).toContain("not independently verified");
    expect(evidence.availability).toContain("Not confirmed");
    expect(evidence.accessibility.toLowerCase()).toContain("not verified");
  });

  it("separates demo fixtures from imported directory provenance", () => {
    expect(PROVIDERS.every((provider) => provider.source === "demo")).toBe(true);
    expect(PROVIDERS.every((provider) => provider.rating === 0)).toBe(true);
    expect(PROVIDERS.every((provider) => provider.reviewCount === 0)).toBe(true);

    const demoEvidence = getProviderEvidence(PROVIDERS[0]!);
    expect(demoEvidence.provenance.toLowerCase()).toContain("demonstration");
    expect(demoEvidence.registration).toContain("not independently verified");

    const imported = getProviderEvidence({
      source: "ndis_import",
      directoryActivity: "active_in_source",
      abn: "12345678901",
      sourceId: "12345678901",
      sourceDate: "30 January 2026",
    });
    expect(imported.provenance.toLowerCase()).toContain("imported");
    expect(imported.sourceCheckedLabel).toBe(
      "Directory snapshot dated 30 January 2026",
    );
  });

  it("requires snapshot date when the outlets JSON includes date", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ date: "30 January 2026", data: [] }),
      }),
    );

    const file = await fetchProviderOutlets();
    expect(file.date).toBe("30 January 2026");

    const outlet: ProviderOutlet = {
      ABN: "12345678901",
      Prov_N: "Snapshot Org",
      Head_Office: "Penrith NSW 2750",
      Outletname: "Snapshot outlet",
      Flag: "O",
      Active: 1,
      Phone: "",
      Website: "",
      Email: "",
      Address: "High St, Penrith NSW 2750",
      State_cd: "NSW",
      Post_cd: 2750,
      Latitude: 0,
      Longitude: 0,
      RegGroup: [],
      Post_cd_p: "2750",
      opnhrs: "",
      prfsn: "",
    };

    const provider = mapOutletToProvider(outlet, 0, file.date);
    expect(provider.sourceDate).toBe("30 January 2026");
    expect(getProviderEvidence(provider).sourceDate).toBe("30 January 2026");
  });
});

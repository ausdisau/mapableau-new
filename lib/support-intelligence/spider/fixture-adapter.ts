import { buildProvenance } from "@/lib/support-intelligence/provenance";
import {
  SpiderProviderRecordSchema,
  type SourceAdapter,
  type SpiderProviderRecord,
} from "@/lib/support-intelligence/spider/types";

/** Deterministic synthetic providers for acceptance tests — never shown as live. */
export const SYNTHETIC_SPIDER_FIXTURES: SpiderProviderRecord[] = [
  SpiderProviderRecordSchema.parse({
    sourceId: "synthetic-outlet-sydney-01",
    providerName: "Synthetic Harbour Supports",
    abn: "51824753556",
    registrationNumber: null,
    website: "https://example.invalid/harbour-supports",
    state: "NSW",
    postcode: "2000",
    suburb: "Sydney",
    services: ["Daily personal activities", "Community participation"],
    registrationGroups: ["0107"],
    latitude: -33.8688,
    longitude: 151.2093,
    isDemo: true,
    raw: { fixture: true, Active: 1 },
  }),
  SpiderProviderRecordSchema.parse({
    sourceId: "synthetic-outlet-sydney-01-dup",
    providerName: "Synthetic Harbour Supports",
    abn: "51824753556",
    registrationNumber: null,
    website: "https://example.invalid/harbour-supports",
    state: "NSW",
    postcode: "2000",
    suburb: "Sydney",
    services: ["Daily personal activities"],
    registrationGroups: ["0107"],
    latitude: -33.8688,
    longitude: 151.2093,
    isDemo: true,
    raw: { fixture: true, Active: 1, duplicateOf: "synthetic-outlet-sydney-01" },
  }),
  SpiderProviderRecordSchema.parse({
    sourceId: "synthetic-outlet-melbourne-01",
    providerName: "Synthetic Yarra Care Co-op",
    abn: "53004085616",
    registrationNumber: null,
    website: null,
    state: "VIC",
    postcode: "3000",
    suburb: "Melbourne",
    services: ["Support coordination"],
    registrationGroups: ["0132"],
    latitude: -37.8136,
    longitude: 144.9631,
    isDemo: true,
    raw: { fixture: true, Active: 0 },
  }),
  SpiderProviderRecordSchema.parse({
    sourceId: "synthetic-stale-01",
    providerName: "Synthetic Stale Directory Row",
    abn: null,
    registrationNumber: null,
    website: "https://example.invalid/stale",
    state: "QLD",
    postcode: "4000",
    suburb: "Brisbane",
    services: ["Assistance with daily life"],
    registrationGroups: [],
    latitude: null,
    longitude: null,
    isDemo: true,
    raw: { fixture: true, Active: 1, sourceDate: "2019-01-01" },
  }),
];

export function createFixtureSpiderAdapter(
  records: SpiderProviderRecord[] = SYNTHETIC_SPIDER_FIXTURES,
): SourceAdapter {
  return {
    id: "synthetic_fixture",
    label: "Synthetic Spider fixtures",
    kind: "fixture",
    async fetchPage(ctx) {
      const limit = Math.min(Math.max(ctx.pagination.limit ?? 50, 1), 200);
      const offset = Number.parseInt(ctx.pagination.cursor ?? "0", 10) || 0;
      const items = records.slice(offset, offset + limit);
      return {
        items,
        nextCursor:
          offset + limit < records.length ? String(offset + limit) : null,
        totalEstimate: records.length,
        provenance: buildProvenance({
          sourceKind: "synthetic_fixture",
          sourceUrl: "fixture://local",
          raw: { count: records.length },
          licenseAndReuse: "Synthetic only — not live supply",
          validUntil: "2019-06-01T00:00:00.000Z",
        }),
      };
    },
  };
}

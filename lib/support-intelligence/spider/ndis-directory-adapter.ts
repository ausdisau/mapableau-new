import { z } from "zod";

import {
  extractProviderRecords,
  normaliseNdisProviderRecord,
  sha256Hex,
} from "@/lib/ingestion/ndis-providers";
import { NDIS_LIST_PROVIDERS_URL } from "@/lib/ndis/list-providers-source";
import { getCached, setCached, cacheKey } from "@/lib/support-intelligence/cache";
import { buildProvenance } from "@/lib/support-intelligence/provenance";
import { checkDistributedRateLimit } from "@/lib/support-intelligence/rate-limit";
import {
  SpiderProviderRecordSchema,
  type SourceAdapter,
  type SpiderPage,
  type SpiderProviderRecord,
} from "@/lib/support-intelligence/spider/types";

const CACHE_TTL_MS = 15 * 60 * 1000;

function mapNormalised(raw: ReturnType<typeof normaliseNdisProviderRecord>): SpiderProviderRecord {
  return SpiderProviderRecordSchema.parse({
    sourceId: raw.sourceId,
    providerName: raw.providerName,
    abn: raw.abn,
    registrationNumber: raw.registrationNumber,
    website: raw.website,
    state: raw.state,
    postcode: raw.postcode,
    suburb: raw.suburb,
    services: raw.services,
    registrationGroups: raw.registrationGroups,
    latitude: raw.latitude,
    longitude: raw.longitude,
    isDemo: false,
    raw: raw.raw,
  });
}

/**
 * API-first adapter over the official/static NDIS list-providers export.
 * Reuses canonical normalisation — does not create a parallel provider store.
 */
export function createNdisDirectoryAdapter(options?: {
  sourceUrl?: string;
  /** Inject payload for tests / offline. */
  payloadOverride?: unknown;
}): SourceAdapter {
  const sourceUrl = options?.sourceUrl ?? NDIS_LIST_PROVIDERS_URL;

  return {
    id: "ndis_directory_api",
    label: "NDIS provider directory (API / static export)",
    kind: "api",
    async fetchPage(ctx): Promise<SpiderPage> {
      const limit = Math.min(Math.max(ctx.pagination.limit ?? 50, 1), 200);
      const offset = Number.parseInt(ctx.pagination.cursor ?? "0", 10) || 0;

      const rl = await checkDistributedRateLimit(`spider:ndis:${sourceUrl}`, {
        windowMs: 60_000,
        max: 30,
      });
      if (!rl.allowed) {
        throw new Error("SPIDER_RATE_LIMITED");
      }

      const ck = cacheKey(["ndis-dir", sourceUrl]);
      let payload = options?.payloadOverride ?? getCached<unknown>(ck);
      if (payload === null || payload === undefined) {
        if (options?.payloadOverride !== undefined) {
          payload = options.payloadOverride;
        } else {
          const res = await fetch(sourceUrl, {
            headers: {
              "User-Agent": "MapAble-Spider/0.1 (+https://mapable.com.au)",
              Accept: "application/json",
            },
            signal: ctx.signal,
          });
          if (!res.ok) {
            throw new Error(`NDIS_DIRECTORY_HTTP_${res.status}`);
          }
          payload = await res.json();
          setCached(ck, payload, CACHE_TTL_MS);
        }
      }

      const { records } = extractProviderRecords(payload);
      const sliced = records.slice(offset, offset + limit);
      const items: SpiderProviderRecord[] = [];
      sliced.forEach((record, i) => {
        try {
          const normalised = normaliseNdisProviderRecord(record, offset + i);
          items.push(mapNormalised(normalised));
        } catch {
          // Skip invalid rows; provenance still covers the page.
        }
      });

      const pageBody = JSON.stringify({ offset, limit, count: items.length });
      return {
        items,
        nextCursor:
          offset + limit < records.length ? String(offset + limit) : null,
        totalEstimate: records.length,
        provenance: buildProvenance({
          sourceKind: "ndia_directory",
          sourceUrl,
          raw: { hashSeed: sha256Hex(pageBody), recordCount: records.length },
          licenseAndReuse:
            "NDIS Provider Finder export — directory activity only; not live Commission registration",
        }),
      };
    },
  };
}

/** Exported for taxonomy / duplicate helpers unit tests. */
export const NdisDirectoryPageMetaSchema = z.object({
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

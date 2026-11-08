import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import type { AdProviderAssuranceState } from "@prisma/client";

import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { prisma } from "@/lib/prisma";

const APIS_IO_SEARCH = "https://apis.io/api/v1/search";
const DEFAULT_TIMEOUT_MS = 8000;

export type SeedProvider = {
  provider_id: string;
  integration_role: string;
  official_documentation_url: string | null;
  apis_io_catalog_url: string | null;
  evidence_summary: string;
  assurance_state: string;
  mapable_integration_status: string;
  commercially_authorised: boolean;
  account_entitlement_verified: boolean;
  sandbox_verified: boolean;
  production_enabled: boolean;
  inventory_availability_verified: boolean;
  live_spend_enabled: boolean;
  verification_required: string;
};

export function loadSeedProviderRegistry(): {
  schema_version: string;
  checked_on: string;
  providers: SeedProvider[];
} {
  const filePath = path.join(
    process.cwd(),
    "docs/ads/contracts/mapable_ads_provider_registry_v1_2.json",
  );
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as {
    schema_version: string;
    checked_on: string;
    providers: SeedProvider[];
  };
}

function toAssuranceState(value: string): AdProviderAssuranceState {
  const allowed: AdProviderAssuranceState[] = [
    "catalogued",
    "source_reviewed",
    "vendor_confirmed",
    "commercially_approved",
    "sandbox_verified",
    "security_privacy_accessibility_signed_off",
    "limited_live",
    "production_enabled",
    "suspended",
  ];
  if (allowed.includes(value as AdProviderAssuranceState)) {
    return value as AdProviderAssuranceState;
  }
  return "catalogued";
}

export async function syncSeedRegistryIntoCatalog(): Promise<{ upserted: number }> {
  const seed = loadSeedProviderRegistry();
  let upserted = 0;
  for (const provider of seed.providers) {
    const sourceUrl =
      provider.apis_io_catalog_url ??
      provider.official_documentation_url ??
      `seed://mapable/${provider.provider_id}`;
    const contentHash = createHash("sha256")
      .update(JSON.stringify(provider))
      .digest("hex");
    await prisma.adProviderCatalogEntry.upsert({
      where: {
        catalogProviderId_sourceUrl: {
          catalogProviderId: provider.provider_id,
          sourceUrl,
        },
      },
      create: {
        catalogProviderId: provider.provider_id,
        sourceUrl,
        displayName: provider.provider_id,
        contentHash,
        evidenceClass: provider.assurance_state,
        assuranceState: toAssuranceState(
          provider.production_enabled ? "production_enabled" : "catalogued",
        ),
        // Seed rows are never production-enabled for buying.
        rawMetadataJson: {
          ...provider,
          production_enabled: false,
          live_spend_enabled: false,
          seedCheckedOn: seed.checked_on,
        },
        retrievedAt: new Date(),
      },
      update: {
        contentHash,
        displayName: provider.provider_id,
        rawMetadataJson: {
          ...provider,
          production_enabled: false,
          live_spend_enabled: false,
          seedCheckedOn: seed.checked_on,
        },
        retrievedAt: new Date(),
      },
    });
    upserted += 1;
  }
  return { upserted };
}

export type ApisIoSearchHit = {
  id?: string;
  name?: string;
  title?: string;
  url?: string;
  [key: string]: unknown;
};

/**
 * Read-only APIs.io catalogue fetch. Never mutates partner ads or grants entitlements.
 */
export async function fetchApisIoSearch(query: string, limit = 10): Promise<{
  ok: boolean;
  hits: ApisIoSearchHit[];
  sourceUrl: string;
  etag: string | null;
  contentHash: string;
  error?: string;
}> {
  if (!adsFlagsConfig.isProviderDiscoveryEnabled()) {
    return {
      ok: false,
      hits: [],
      sourceUrl: APIS_IO_SEARCH,
      etag: null,
      contentHash: "",
      error: "MAPABLE_ADS_PROVIDER_DISCOVERY_ENABLED is false",
    };
  }

  const sourceUrl = `${APIS_IO_SEARCH}?q=${encodeURIComponent(query)}&limit=${limit}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(sourceUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const text = await response.text();
    const contentHash = createHash("sha256").update(text).digest("hex");
    const etag = response.headers.get("etag");
    if (!response.ok) {
      return {
        ok: false,
        hits: [],
        sourceUrl,
        etag,
        contentHash,
        error: `HTTP ${response.status}`,
      };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        ok: false,
        hits: [],
        sourceUrl,
        etag,
        contentHash,
        error: "invalid JSON from catalogue",
      };
    }
    const hits = normaliseHits(parsed);
    return { ok: true, hits, sourceUrl, etag, contentHash };
  } catch (err) {
    return {
      ok: false,
      hits: [],
      sourceUrl,
      etag: null,
      contentHash: "",
      error: err instanceof Error ? err.message : "catalogue fetch failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

function normaliseHits(parsed: unknown): ApisIoSearchHit[] {
  if (Array.isArray(parsed)) return parsed as ApisIoSearchHit[];
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    for (const key of ["results", "providers", "data", "items"]) {
      if (Array.isArray(obj[key])) return obj[key] as ApisIoSearchHit[];
    }
  }
  return [];
}

export async function cacheApisIoHits(input: {
  query: string;
  hits: ApisIoSearchHit[];
  sourceUrl: string;
  etag: string | null;
  contentHash: string;
}): Promise<number> {
  let count = 0;
  for (const hit of input.hits) {
    const catalogProviderId = String(
      hit.id ?? hit.name ?? hit.title ?? `anon-${count}`,
    ).slice(0, 120);
    const sourceUrl = String(hit.url ?? input.sourceUrl);
    await prisma.adProviderCatalogEntry.upsert({
      where: {
        catalogProviderId_sourceUrl: {
          catalogProviderId,
          sourceUrl,
        },
      },
      create: {
        catalogProviderId,
        sourceUrl,
        displayName: String(hit.name ?? hit.title ?? catalogProviderId),
        contentHash: input.contentHash,
        etag: input.etag,
        evidenceClass: "catalogue_or_public_docs_only",
        assuranceState: "catalogued",
        rawMetadataJson: {
          query: input.query,
          hit,
          notice: "Catalogue metadata only — not a buying entitlement",
        },
        retrievedAt: new Date(),
      },
      update: {
        displayName: String(hit.name ?? hit.title ?? catalogProviderId),
        contentHash: input.contentHash,
        etag: input.etag,
        rawMetadataJson: {
          query: input.query,
          hit,
          notice: "Catalogue metadata only — not a buying entitlement",
        },
        retrievedAt: new Date(),
      },
    });
    count += 1;
  }
  return count;
}

export async function listCatalogProviders() {
  return prisma.adProviderCatalogEntry.findMany({
    orderBy: [{ assuranceState: "asc" }, { catalogProviderId: "asc" }],
    take: 200,
  });
}

import { userHasAdsPermission } from "@/lib/ads/auth/ads-permissions";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import {
  cacheApisIoHits,
  fetchApisIoSearch,
  syncSeedRegistryIntoCatalog,
} from "@/lib/ads/discovery/provider-discovery";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";

/**
 * POST /api/ads/v1/discovery/sync — read-only catalogue + seed sync.
 * Never enables live spend.
 */
export async function POST(request: Request) {
  if (!adsFlagsConfig.isProviderDiscoveryEnabled()) {
    return jsonError("Provider discovery is disabled", 404);
  }

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!userHasAdsPermission(user, "ads:providers:manage")) {
    // Fall back: admins have all permissions via hasPermission short-circuit;
    // provider_admin lacks manage — allow read sync for manage OR read+admin.
    if (!userHasAdsPermission(user, "ads:providers:read")) {
      return apiForbidden("Missing ads provider permission");
    }
  }

  const seed = await syncSeedRegistryIntoCatalog();
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "advertising";
  const remote = await fetchApisIoSearch(query, 10);
  let cached = 0;
  if (remote.ok) {
    cached = await cacheApisIoHits({
      query,
      hits: remote.hits,
      sourceUrl: remote.sourceUrl,
      etag: remote.etag,
      contentHash: remote.contentHash,
    });
  }

  await createAuditEvent({
    action: "ads.provider_discovery.sync",
    actorUserId: user.id,
    entityType: "AdProviderCatalogEntry",
    entityId: "catalog",
    metadata: {
      seedUpserted: seed.upserted,
      remoteOk: remote.ok,
      remoteCached: cached,
      query,
    },
  });

  return jsonOk({
    seedUpserted: seed.upserted,
    remote: {
      ok: remote.ok,
      sourceUrl: remote.sourceUrl,
      cached,
      error: remote.error ?? null,
      notice: "Catalogue sync does not grant buying entitlements",
    },
  });
}

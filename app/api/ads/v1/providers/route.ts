import { userHasAdsPermission } from "@/lib/ads/auth/ads-permissions";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import {
  listCatalogProviders,
  syncSeedRegistryIntoCatalog,
} from "@/lib/ads/discovery/provider-discovery";
import {
  assertPlacementApiEnabled,
  placementApiDisabledResponse,
} from "@/lib/ads/manager/flag-gate";
import { jsonOk } from "@/lib/api/response";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";

/**
 * GET /api/ads/v1/providers — read-only registry with provenance.
 * Catalogue rows are never buyable solely because they appear here.
 */
export async function GET() {
  if (!assertPlacementApiEnabled() && !adsFlagsConfig.isProviderDiscoveryEnabled()) {
    return placementApiDisabledResponse();
  }

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!userHasAdsPermission(user, "ads:providers:read")) {
    return apiForbidden("Missing ads:providers:read");
  }

  await syncSeedRegistryIntoCatalog();
  const rows = await listCatalogProviders();

  return jsonOk({
    providers: rows.map((row) => {
      const meta = (row.rawMetadataJson ?? {}) as Record<string, unknown>;
      return {
        providerId: row.catalogProviderId,
        displayName: row.displayName,
        sourceUrl: row.sourceUrl,
        assuranceState: row.assuranceState,
        evidenceClass: row.evidenceClass,
        retrievedAt: row.retrievedAt.toISOString(),
        contentHash: row.contentHash,
        productionEnabled: meta.production_enabled === true,
        liveSpendEnabled: meta.live_spend_enabled === true,
        accessState: "demo",
        notice:
          "Discovery metadata only. Not a trading entitlement or live inventory claim.",
      };
    }),
  });
}

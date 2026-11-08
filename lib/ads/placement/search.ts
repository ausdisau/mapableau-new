import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { createDoohSandboxAdapter } from "@/lib/ads/connectors/dooh-sandbox";
import { SYNTHETIC_DOOH_SCREENS } from "@/lib/ads/fixtures/dooh-sandbox-inventory";
import {
  assertNoSensitiveTargeting,
  hardFilterCandidate,
  rankEligible,
  type Exclusion,
  type PlacementCandidate,
  type PlacementSearchInput,
} from "@/lib/ads/placement/eligibility";
import { getPlacement } from "@/lib/ads/placement-registry";

const OWNED_PLACEMENTS = [
  "access.map.sponsored-card",
  "access.map.sponsored-marker",
  "provider-finder.results.inline",
] as const;

function ownedCandidates(now: Date): PlacementCandidate[] {
  return OWNED_PLACEMENTS.map((code, index) => {
    const placement = getPlacement(code);
    return {
      opportunityId: `mapable-owned-${code}`,
      channel: "mapable" as const,
      providerId: "mapable-owned",
      externalInventoryId: code,
      inventoryType: "owned_reservation",
      geoRegion: "AU",
      availabilityState: "indicative" as const,
      inventorySource: "mapable_placement_registry",
      sourceObservedAt: now.toISOString(),
      buyingMode: "owned_reservation",
      currency: "AUD",
      minimumSpendMinor: 10000,
      priceEstimateMinor: 25000 + index * 5000,
      formatSpecs: {
        aspectRatio: "16:9",
        formats: placement?.capabilities.supportsImage
          ? ["image", "text"]
          : ["text"],
      },
      screenEnvironment: "digital_platform",
      commercialAuthorityState: "demo" as const,
      reasonsEligible: ["owned_inventory_fixture"],
    };
  });
}

function doohCandidates(_now: Date): PlacementCandidate[] {
  if (!adsFlagsConfig.isDoohSandboxEnabled()) return [];
  return SYNTHETIC_DOOH_SCREENS.map((screen) => ({
    opportunityId: `dooh-sandbox-${screen.providerScreenId}`,
    channel: "dooh" as const,
    providerId: "dooh-sandbox",
    externalInventoryId: screen.providerScreenId,
    inventoryType: "screen",
    geoRegion: `${screen.countryCode}-${screen.venueType}`,
    availabilityState: "indicative" as const,
    inventorySource: "synthetic_fixture",
    sourceObservedAt: screen.inventoryObservedAt,
    buyingMode: "guaranteed",
    currency: "AUD",
    minimumSpendMinor: 50000,
    priceEstimateMinor: 125000,
    formatSpecs: {
      aspectRatio: screen.creativeSpecs.aspectRatio,
      formats: ["image", "video"].filter((f) =>
        f === "video"
          ? screen.creativeSpecs.allowedMime.some((m) => m.startsWith("video/"))
          : true,
      ),
    },
    screenEnvironment: screen.venueType,
    commercialAuthorityState: "demo" as const,
    reasonsEligible: ["dooh_sandbox_fixture"],
  }));
}

export async function searchPlacementOpportunities(
  input: PlacementSearchInput,
): Promise<{
  opportunities: Array<
    PlacementCandidate & { buyable: boolean; exclusionReasons: string[] }
  >;
  exclusions: Exclusion[];
  ruleVersion: string;
}> {
  assertNoSensitiveTargeting(input);
  const now = new Date();
  const pool = [...ownedCandidates(now), ...doohCandidates(now)];

  // Touch sandbox adapter so capability probes stay wired for tests.
  if (adsFlagsConfig.isDoohSandboxEnabled()) {
    await createDoohSandboxAdapter().getCapabilities();
  }

  const eligible: PlacementCandidate[] = [];
  const exclusions: Exclusion[] = [];

  for (const candidate of pool) {
    const result = hardFilterCandidate(candidate, input, now);
    if (!result.ok) {
      exclusions.push({
        opportunityId: candidate.opportunityId,
        reasonCodes: result.reasonCodes,
      });
      continue;
    }
    eligible.push(candidate);
  }

  const ranked = rankEligible(eligible, input);
  return {
    opportunities: ranked.map((row) => ({
      ...row,
      // Demo inventory is plannable/quotable but not production-buyable.
      buyable: false,
      exclusionReasons: [],
    })),
    exclusions,
    ruleVersion: "placement-rank-v1",
  };
}

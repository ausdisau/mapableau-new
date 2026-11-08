import type { AdAvailabilityState, AdBuyingChannel } from "@prisma/client";

import { SENSITIVE_AD_CONTEXT_KEYS } from "@/lib/ads/privacy/sensitive-keys";

export type PlacementSearchInput = {
  channels?: AdBuyingChannel[];
  region?: { country: string; state?: string; locality?: string };
  flight?: { start: string; end: string; timeZone: string };
  budget?: { amountMinor: number; currency: string };
  creative?: { format: string; aspectRatio?: string; captioned?: boolean };
  targeting?: { kind: string; dayparts?: string[] };
};

export type PlacementCandidate = {
  opportunityId: string;
  channel: AdBuyingChannel;
  providerId: string;
  externalInventoryId: string;
  inventoryType: string;
  geoRegion: string;
  availabilityState: AdAvailabilityState;
  inventorySource: string;
  sourceObservedAt: string;
  buyingMode: string;
  currency: string;
  minimumSpendMinor: number;
  priceEstimateMinor: number;
  formatSpecs: { aspectRatio?: string; formats: string[] };
  screenEnvironment?: string;
  commercialAuthorityState: "demo" | "pending_access" | "enabled" | "disabled";
  reasonsEligible: string[];
};

export type Exclusion = {
  opportunityId: string;
  reasonCodes: string[];
};

const STALE_MS = 14 * 24 * 60 * 60 * 1000;

export function assertNoSensitiveTargeting(input: PlacementSearchInput): void {
  const blob = JSON.stringify(input).toLowerCase();
  for (const key of SENSITIVE_AD_CONTEXT_KEYS) {
    if (blob.includes(key.toLowerCase())) {
      throw new Error(`Sensitive targeting key prohibited: ${key}`);
    }
  }
  if (input.targeting && input.targeting.kind !== "contextual") {
    throw new Error("Only contextual targeting is permitted");
  }
}

export function hardFilterCandidate(
  candidate: PlacementCandidate,
  input: PlacementSearchInput,
  now = new Date(),
): { ok: true } | { ok: false; reasonCodes: string[] } {
  const reasonCodes: string[] = [];

  if (input.channels && input.channels.length > 0) {
    if (!input.channels.includes(candidate.channel)) {
      reasonCodes.push("CHANNEL_FILTER");
    }
  }

  if (candidate.commercialAuthorityState === "disabled") {
    reasonCodes.push("PROVIDER_DISABLED");
  }

  if (candidate.availabilityState === "unavailable") {
    reasonCodes.push("INVENTORY_UNAVAILABLE");
  }

  const observed = Date.parse(candidate.sourceObservedAt);
  if (Number.isFinite(observed) && now.getTime() - observed > STALE_MS) {
    reasonCodes.push("STALE_INVENTORY");
  }

  if (input.region?.country && candidate.geoRegion) {
    if (!candidate.geoRegion.startsWith(input.region.country)) {
      reasonCodes.push("REGION_MISMATCH");
    }
  }

  if (input.budget) {
    if (input.budget.currency !== candidate.currency) {
      reasonCodes.push("CURRENCY_MISMATCH");
    }
    if (candidate.minimumSpendMinor > input.budget.amountMinor) {
      reasonCodes.push("BELOW_MINIMUM_SPEND");
    }
  }

  if (input.creative?.format) {
    if (!candidate.formatSpecs.formats.includes(input.creative.format)) {
      reasonCodes.push("FORMAT_INCOMPATIBLE");
    }
  }

  if (input.creative?.aspectRatio && candidate.formatSpecs.aspectRatio) {
    if (input.creative.aspectRatio !== candidate.formatSpecs.aspectRatio) {
      reasonCodes.push("ASPECT_RATIO_MISMATCH");
    }
  }

  // Buyable only when commercially authorised AND not merely catalogue-demo for live spend.
  // Demo/sandbox opportunities remain searchable for planning but marked non-buyable later.
  if (reasonCodes.length > 0) return { ok: false, reasonCodes };
  return { ok: true };
}

/** Soft ranking for eligible options only — no disability/health signals. */
export function rankEligible(
  candidates: PlacementCandidate[],
  input: PlacementSearchInput,
): PlacementCandidate[] {
  const weights = {
    objectiveFit: 0.3,
    priceTransparency: 0.2,
    availabilityConfidence: 0.2,
    contextualRelevance: 0.15,
    deliveryEvidence: 0.1,
    scheduling: 0.05,
  };

  return [...candidates]
    .map((c) => {
      const availabilityScore =
        c.availabilityState === "confirmed"
          ? 1
          : c.availabilityState === "indicative"
            ? 0.6
            : 0.2;
      const priceScore =
        input.budget && c.priceEstimateMinor > 0
          ? Math.max(
              0,
              1 - c.priceEstimateMinor / Math.max(input.budget.amountMinor, 1),
            )
          : 0.5;
      const contextual =
        input.region?.locality &&
        c.geoRegion.toLowerCase().includes(input.region.locality.toLowerCase())
          ? 1
          : 0.5;
      const score =
        weights.objectiveFit * 0.7 +
        weights.priceTransparency * priceScore +
        weights.availabilityConfidence * availabilityScore +
        weights.contextualRelevance * contextual +
        weights.deliveryEvidence * 0.5 +
        weights.scheduling * 0.5;
      return { c, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((row) => row.c);
}

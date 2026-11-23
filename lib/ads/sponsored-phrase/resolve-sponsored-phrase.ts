/**
 * Local authored sponsored-phrase resolver.
 * No placement API, impression, auction, or billing calls.
 */

import type { AdsFlagEnv } from "@/lib/ads/config/flags";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import {
  createEmptyKillSwitchState,
  isKilled,
  type KillSwitchState,
} from "@/lib/ads/config/kill-switches";
import { validateAdDestination } from "@/lib/ads/destination/validate-url";
import {
  getSyntheticSponsoredPhraseCreatives,
  SYNTHETIC_PHRASE_DESTINATION,
  SYNTHETIC_PHRASE_ALT_DESTINATION,
} from "@/lib/ads/fixtures/synthetic-sponsored-phrase";
import {
  isSponsoredPhraseRouteEligible,
  isSponsoredPhraseTopicEligible,
} from "@/lib/ads/sponsored-phrase/eligible-routes";
import type {
  AdPolicyReasonCode,
  SponsoredPhraseCreative,
  SponsoredPhraseResolveInput,
} from "@/lib/ads/types";

export type SponsoredPhraseResolveResult =
  | { ok: true; creative: SponsoredPhraseCreative }
  | { ok: false; reasonCode: AdPolicyReasonCode };

export type ResolveSponsoredPhraseOptions = {
  env?: AdsFlagEnv;
  killSwitches?: KillSwitchState;
  now?: Date;
  /** When true, reader opted in to show sponsored links. Default treated as false. */
  showSponsoredLinks?: boolean;
  /** Override inventory (tests). Defaults to synthetic fixtures. */
  inventory?: SponsoredPhraseCreative[];
  /** Prefer a specific creative id when multiple active creatives share a topic. */
  preferredCreativeId?: string;
};

const SYNTHETIC_ALLOWED_DESTINATIONS = new Set([
  SYNTHETIC_PHRASE_DESTINATION,
  SYNTHETIC_PHRASE_ALT_DESTINATION,
]);

function isScheduleActive(
  creative: SponsoredPhraseCreative,
  now: Date,
): boolean {
  const start = Date.parse(creative.startsAt);
  const end = Date.parse(creative.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  const t = now.getTime();
  return t >= start && t <= end;
}

function destinationAllowed(destinationUrl: string): boolean {
  // Pilot accepts reviewed HTTPS destinations only (incl. synthetic demo URLs).
  const validation = validateAdDestination(destinationUrl, {
    requireHttps: true,
  });
  if (!validation.ok) return false;
  // Disallow arbitrary hosts in this synthetic slice unless allowlisted.
  if (SYNTHETIC_ALLOWED_DESTINATIONS.has(destinationUrl)) return true;
  return false;
}

/**
 * Resolve at most one authored sponsored phrase for an eligible public topic.
 * Returns null-equivalent (`ok: false`) with no network side effects.
 */
export function resolveSponsoredPhrase(
  input: SponsoredPhraseResolveInput,
  options: ResolveSponsoredPhraseOptions = {},
): SponsoredPhraseResolveResult {
  const env = options.env ?? process.env;
  const now = options.now ?? new Date();
  const showSponsoredLinks = options.showSponsoredLinks === true;

  if (!adsFlagsConfig.isSponsoredPhraseEnabled(env)) {
    return { ok: false, reasonCode: "FEATURE_FLAG_OFF" };
  }

  const kill =
    options.killSwitches ??
    createEmptyKillSwitchState(adsFlagsConfig.isGlobalKillSwitch(env));
  const killed = isKilled(kill, {
    surface: "public_explore",
    placementCode: "explore.topic.sponsored-phrase",
  });
  if (killed.killed) {
    return { ok: false, reasonCode: "GLOBAL_KILL_SWITCH" };
  }

  if (!showSponsoredLinks) {
    return { ok: false, reasonCode: "MISSING_REQUIRED_CONSENT" };
  }

  if (!isSponsoredPhraseRouteEligible(input.routePath)) {
    return { ok: false, reasonCode: "PLACEMENT_UNSUPPORTED" };
  }

  if (!isSponsoredPhraseTopicEligible(input.topicKey)) {
    return { ok: false, reasonCode: "PLACEMENT_UNSUPPORTED" };
  }

  const inventory =
    options.inventory ?? getSyntheticSponsoredPhraseCreatives(now);

  const candidates = inventory.filter(
    (creative) => creative.topicKey === input.topicKey,
  );

  if (candidates.length === 0) {
    return { ok: false, reasonCode: "NO_ELIGIBLE_CAMPAIGN" };
  }

  const preferred = options.preferredCreativeId
    ? candidates.find((c) => c.id === options.preferredCreativeId)
    : undefined;

  const ordered = preferred
    ? [preferred, ...candidates.filter((c) => c.id !== preferred.id)]
    : candidates;

  for (const creative of ordered) {
    if (!creative.payerName?.trim()) {
      continue;
    }
    if (!creative.linkedPhrase?.trim()) {
      continue;
    }
    if (creative.status === "paused") {
      continue;
    }
    if (creative.status === "expired" || !isScheduleActive(creative, now)) {
      continue;
    }
    if (!destinationAllowed(creative.destinationUrl)) {
      continue;
    }
    return { ok: true, creative };
  }

  const anyInvalidDestination = ordered.some(
    (c) =>
      c.status === "active" &&
      isScheduleActive(c, now) &&
      c.payerName?.trim() &&
      !destinationAllowed(c.destinationUrl),
  );
  if (anyInvalidDestination) {
    return { ok: false, reasonCode: "INVALID_DESTINATION" };
  }

  return { ok: false, reasonCode: "NO_FILL" };
}

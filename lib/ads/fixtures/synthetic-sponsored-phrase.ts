/**
 * Synthetic sponsored-phrase inventory for the public Explore pilot.
 * Never seed real advertiser or participant data.
 */

import type { SponsoredPhraseCreative } from "@/lib/ads/types";

export const SYNTHETIC_PHRASE_TOPIC_WHATS_ON = "whats-on-general";
export const SYNTHETIC_PHRASE_CAMPAIGN_ID = "camp_synth_phrase_example_arts";
export const SYNTHETIC_PHRASE_CREATIVE_ID = "cre_synth_phrase_example_arts";

/** Reviewed HTTPS destination for the local synthetic demo. */
export const SYNTHETIC_PHRASE_DESTINATION =
  "https://example.com/mapable-synthetic/example-arts-programme";

export const SYNTHETIC_PHRASE_ALT_CAMPAIGN_ID =
  "camp_synth_phrase_inclusive_events";
export const SYNTHETIC_PHRASE_ALT_CREATIVE_ID =
  "cre_synth_phrase_inclusive_events";
export const SYNTHETIC_PHRASE_ALT_DESTINATION =
  "https://example.com/mapable-synthetic/inclusive-events-calendar";

/**
 * Primary Example Arts topic-month creative (calendar month around "now"
 * is overridden in tests via `now` / schedule fields).
 */
export function getSyntheticSponsoredPhraseCreatives(
  now: Date = new Date(),
): SponsoredPhraseCreative[] {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const startsAt = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString();
  const endsAt = new Date(
    Date.UTC(year, month + 1, 0, 23, 59, 59),
  ).toISOString();

  return [
    {
      id: SYNTHETIC_PHRASE_CREATIVE_ID,
      campaignId: SYNTHETIC_PHRASE_CAMPAIGN_ID,
      topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON,
      payerName: "Example Arts",
      prefixText: "Browse the ",
      linkedPhrase: "Example Arts programme",
      suffixText: " for upcoming performances.",
      destinationUrl: SYNTHETIC_PHRASE_DESTINATION,
      startsAt,
      endsAt,
      whyThisAd:
        "This is a fixed sponsorship of the general public “What’s on” topic for a calendar month. The same creative is shown to every reader who chooses to show sponsored links. Essential discovery, human help and accessibility evidence stay free.",
      status: "active",
    },
    {
      id: SYNTHETIC_PHRASE_ALT_CREATIVE_ID,
      campaignId: SYNTHETIC_PHRASE_ALT_CAMPAIGN_ID,
      topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON,
      payerName: "Inclusive Events Co",
      prefixText: "See the ",
      linkedPhrase: "Inclusive Events calendar",
      suffixText: " for community performances.",
      destinationUrl: SYNTHETIC_PHRASE_ALT_DESTINATION,
      startsAt,
      endsAt,
      whyThisAd:
        "This is a fixed sponsorship of the general public “What’s on” topic. Selection does not use your search, profile or location.",
      status: "active",
    },
  ];
}

export function getPrimarySyntheticSponsoredPhrase(
  now: Date = new Date(),
): SponsoredPhraseCreative {
  return getSyntheticSponsoredPhraseCreatives(now)[0]!;
}

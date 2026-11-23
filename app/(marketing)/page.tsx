import type { Metadata } from "next";

import { MapAbleCareCombinedHomepageSections } from "@/components/marketing/MapAbleCareCombinedHomepage";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { canonicalAlternate } from "@/lib/config/canonical-url";

/**
 * Request-time rendering so MAPABLE_ADS_GLOBAL_KILL_SWITCH / phrase flags are
 * not frozen into a static RSC payload for the Explore sponsored-phrase pilot.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MapAble | Accessibility you can plan around",
  description:
    "Explore MapAble’s evidence-based accessibility map and programme explainers, then pre-register for the controlled pilot as a participant or provider.",
  alternates: canonicalAlternate("/"),
  openGraph: {
    url: "/",
    title: "MapAble | Accessibility you can plan around",
    description:
      "Public accessibility information for Australia — plus pilot interest for participants and providers. Not general bookings or NDIS claims.",
  },
};

export default function Page() {
  // True Server Component — private MAPABLE_ADS_* env is available here.
  // HomepageExploreStrip lives under a client parent, so enablement must be
  // passed down rather than re-read from process.env in the client bundle.
  // force-dynamic above keeps this evaluation per-request for kill switches.
  const sponsoredPhraseServerEnabled =
    adsFlagsConfig.isSponsoredPhraseEnabled();

  return (
    <MapAbleCareCombinedHomepageSections
      sponsoredPhraseServerEnabled={sponsoredPhraseServerEnabled}
    />
  );
}

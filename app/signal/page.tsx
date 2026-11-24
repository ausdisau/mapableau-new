import type { Metadata } from "next";

import CommunityLiveApp from "@/components/community-live/CommunityLiveApp";
import SignalSitesApp from "@/components/signal-sites/SignalSitesApp";
import { communityLiveEnabled } from "@/lib/community-live/runtime";

export const metadata: Metadata = {
  title: "MapAble Signal | Mapping Challenges",
  description:
    "Participant-led Community Mapping Challenges on MapAble Signal. Observations are scoped reports, not independent accessibility verification or legal certification.",
};

export const dynamic = "force-dynamic";

/**
 * Canonical Signal route for signal.mapable.com.au (and direct /signal).
 * Same workspace split as /community:
 * - Flag OFF: browser-local fictional Signal Sites prototype.
 * - Flag ON: authenticated, server-backed Community records only.
 */
export default function SignalPage() {
  return communityLiveEnabled() ? <CommunityLiveApp /> : <SignalSitesApp />;
}

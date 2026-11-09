import type { Metadata } from "next";

import CommunityLiveApp from "@/components/community-live/CommunityLiveApp";
import SignalSitesApp from "@/components/signal-sites/SignalSitesApp";
import { communityLiveEnabled } from "@/lib/community-live/runtime";

export const metadata: Metadata = {
  title: "MapAble Community | Mapping Challenges",
  description:
    "Participant-led Community Mapping Challenges. Observations are scoped reports, not independent accessibility verification or legal certification.",
};

export const dynamic = "force-dynamic";

/**
 * Two distinct workspaces:
 * - Flag OFF: existing browser-local, fictional Signal Sites prototype.
 * - Flag ON: authenticated, server-backed Community records only.
 * Never import local seed data into live records or represent it as public evidence.
 */
export default function CommunitySignalSitesPage() {
  return communityLiveEnabled() ? <CommunityLiveApp /> : <SignalSitesApp />;
}

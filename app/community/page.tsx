import type { Metadata } from "next";

import SignalSitesApp from "@/components/signal-sites/SignalSitesApp";

export const metadata: Metadata = {
  title: "MapAble Signal | Community Mapping Challenges",
  description:
    "MapAble Signal — participant-controlled Community Mapping Challenges for accessibility observations, local review and redacted reports. Browser-local prototype; not certification.",
};

export const dynamic = "force-dynamic";

export default function CommunitySignalSitesPage() {
  return <SignalSitesApp />;
}

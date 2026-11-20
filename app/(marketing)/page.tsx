import type { Metadata } from "next";

import { OnePublicWorkspaceExplainer } from "@/components/mapable-one/OnePublicWorkspaceExplainer";
import { MapAbleCareCombinedHomepageSections } from "@/components/marketing/MapAbleCareCombinedHomepage";
import { canonicalAlternate } from "@/lib/config/canonical-url";
import { isMapAbleOneUnifiedShellEnabled } from "@/lib/config/mapable-one-shell";

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
  const oneShell = isMapAbleOneUnifiedShellEnabled();
  return (
    <>
      <MapAbleCareCombinedHomepageSections />
      {oneShell ? <OnePublicWorkspaceExplainer /> : null}
    </>
  );
}

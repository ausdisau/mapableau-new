import type { Metadata } from "next";

import { CommunityInfrastructureExplorer } from "@/components/accessibility-map/community/CommunityInfrastructureExplorer";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Community access: parking, toilets and public spaces | MapAble",
  description:
    "Explore mapped parking, toilets and public spaces in Western Sydney study areas. Review source reports, missing access details and evidence dates in a list or on a map.",
};

export default function CommunityInfrastructurePage() {
  return (
    <MapAbleCareMarketingShell>
      <CommunityInfrastructureExplorer />
    </MapAbleCareMarketingShell>
  );
}

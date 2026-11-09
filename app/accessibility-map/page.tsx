import type { Metadata } from "next";

import { AccessibilityMapLanding } from "@/components/accessibility-map/AccessibilityMapLanding";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { getAccessMapPlaces } from "@/lib/access/map/access-map-places";
import { MAPABLE_ADL_SOURCE_LABEL } from "@/lib/access/map/copy";

export const metadata: Metadata = {
  title: "Accessibility Map | MapAble",
  description:
    "Explore source-attributed place information and known gaps. Illustrative examples and historical records do not establish current accessibility or route suitability.",
};

export default async function AccessibilityMapPage() {
  const places = await getAccessMapPlaces();
  const partnerCount = places.filter((p) => !p.isDemo).length;

  return (
    <MapAbleCareMarketingShell>
      <AccessibilityMapLanding
        initialPlaces={places}
        dataSourceNote={
          partnerCount > 0
            ? `Includes ${partnerCount.toLocaleString("en-AU")} historical source locations from ${MAPABLE_ADL_SOURCE_LABEL}. These are not independently verified accessibility assessments.`
            : undefined
        }
      />
    </MapAbleCareMarketingShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { AccessibilityMapLanding } from "@/components/accessibility-map/AccessibilityMapLanding";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { getAccessMapPlaces } from "@/lib/access/map/access-map-places";
import { MAPABLE_ADL_SOURCE_LABEL } from "@/lib/access/map/copy";

export const metadata: Metadata = {
  title: "Accessibility Map | MapAble",
  description:
    "Know before you go. Search accessible places with practical details, confidence levels, measurements, and transport options — including MapAble by Australian Disability Ltd locations.",
};

export default async function AccessibilityMapPage() {
  const places = await getAccessMapPlaces();
  const partnerCount = places.filter((p) => !p.isDemo).length;

  return (
    <MapAbleCareMarketingShell>
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto max-w-7xl text-sm">
          <Link
            href="/accessibility-map/community"
            className="inline-flex min-h-11 items-center rounded-lg font-semibold text-[#005B7F] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#005B7F]"
          >
            Explore community parking, toilets and public spaces
          </Link>
          <p className="text-slate-600">
            Western Sydney source reports with access details and explicit
            unknowns.
          </p>
        </div>
      </div>
      <AccessibilityMapLanding
        initialPlaces={places}
        dataSourceNote={
          partnerCount > 0
            ? `Includes ${partnerCount.toLocaleString("en-AU")} locations from ${MAPABLE_ADL_SOURCE_LABEL}.`
            : undefined
        }
      />
    </MapAbleCareMarketingShell>
  );
}

"use client";

import React from "react";

import { BoundaryNotice } from "@/components/canvas/BoundaryNotice";
import { CompetitorContrastStrip } from "@/components/marketing/home/CompetitorContrastStrip";
import { HeroSection } from "@/components/marketing/home/HeroSection";
import { HomepageExploreStrip } from "@/components/marketing/home/HomepageExploreStrip";
import { HomepageFinalCta } from "@/components/marketing/home/HomepageFinalCta";
import { MyMapAbleHomepageSection } from "@/components/marketing/home/MyMapAbleHomepageSection";
import { PreRegistrationSection } from "@/components/marketing/home/PreRegistrationSection";
import { MapAbleCareMarketingHeader } from "@/components/marketing/mapable-care-shared";
import { MapAbleCareMarketingFooter } from "@/components/marketing/MapAbleCareMarketingFooter";

export { mapAbleCareCombinedDesignTests } from "@/lib/marketing/mapable-care-combined-data";
export { MapAbleCareMarketingTypography } from "@/components/marketing/MapAbleCareTypography";
export { MapAbleCareMarketingHeader } from "@/components/marketing/mapable-care-shared";
export { MapAbleCareMarketingFooter } from "@/components/marketing/MapAbleCareMarketingFooter";

export type MapAbleCareCombinedHomepageSectionsProps = {
  /**
   * Server-evaluated ads enablement (flags + kill switch).
   * Must be computed in a Server Component — this module is a client boundary.
   */
  sponsoredPhraseServerEnabled?: boolean;
};

/** Marketing proof splash: hero → explore → why MapAble → pre-register → CTA. */
export function MapAbleCareCombinedHomepageSections({
  sponsoredPhraseServerEnabled = false,
}: MapAbleCareCombinedHomepageSectionsProps = {}) {
  return (
    <>
      <HeroSection />
      <HomepageExploreStrip
        sponsoredPhraseServerEnabled={sponsoredPhraseServerEnabled}
      />
      <MyMapAbleHomepageSection />
      <CompetitorContrastStrip />
      <PreRegistrationSection />
      <HomepageFinalCta />
      <BoundaryNotice />
      <noscript>
        <div className="mx-auto max-w-7xl px-5 py-8 text-sm text-slate-700 lg:px-8">
          MapAble core pages work without JavaScript for reading and following
          links. Pre-registration requires JavaScript; email
          support@mapable.com.au if needed.
        </div>
      </noscript>
    </>
  );
}

export default function MapAbleCareCombinedHomepage({
  sponsoredPhraseServerEnabled = false,
}: MapAbleCareCombinedHomepageSectionsProps = {}) {
  return (
    <main
      id="main-content"
      className="mapable-soft flex min-h-screen flex-col bg-white text-[#0C1833]"
    >
      <MapAbleCareMarketingHeader />
      <MapAbleCareCombinedHomepageSections
        sponsoredPhraseServerEnabled={sponsoredPhraseServerEnabled}
      />
      <MapAbleCareMarketingFooter />
    </main>
  );
}

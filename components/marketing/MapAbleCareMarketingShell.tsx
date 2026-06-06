"use client";

import type { ReactNode } from "react";

import {
  MapAbleCareMarketingFooter,
  MapAbleCareMarketingHeader,
  MapAbleCareMarketingTypography,
} from "@/components/marketing/MapAbleCareCombinedHomepage";

export function MapAbleCareMarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="mapable-soft flex min-h-screen flex-col bg-white text-[#0C1833]">
      <MapAbleCareMarketingTypography />
      <MapAbleCareMarketingHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <MapAbleCareMarketingFooter />
    </div>
  );
}

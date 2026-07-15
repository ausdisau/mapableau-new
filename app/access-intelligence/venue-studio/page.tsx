import type { Metadata } from "next";
import React from "react";

import { VenueStudioClient } from "@/components/access-intelligence/venue-studio";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Venue Studio | Access Intelligence",
  description:
    "Venue accessibility evidence gaps, live incidents, and transparent remediation priorities.",
};

export default function VenueStudioPage() {
  return (
    <MapAbleCareMarketingShell>
      <VenueStudioClient />
    </MapAbleCareMarketingShell>
  );
}

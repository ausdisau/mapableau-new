import type { Metadata } from "next";
import React from "react";

import { VenueOpsClient } from "@/components/access-intelligence/physical/venue-ops-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";


export const metadata: Metadata = {
  title: "Venue Ops Physical | Access Intelligence",
  description: "Venue operator console for Physical Systems.",
};

export default function Page() {
  return (
    <MapAbleCareMarketingShell>
      <VenueOpsClient />
    </MapAbleCareMarketingShell>
  );
}

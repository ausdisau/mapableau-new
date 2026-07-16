import type { Metadata } from "next";
import React from "react";

import { ExplorePlacesClient } from "@/components/access-intelligence/explore-places";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Explore places | Access Intelligence",
  description: "Search venues and open map-free accessibility detail pages.",
};

export default function ExplorePlacesPage() {
  return (
    <MapAbleCareMarketingShell>
      <ExplorePlacesClient />
    </MapAbleCareMarketingShell>
  );
}

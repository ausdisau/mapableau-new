import type { Metadata } from "next";
import React from "react";

import { PhysicalScoutClient } from "@/components/access-intelligence/physical/physical-scout-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";


export const metadata: Metadata = {
  title: "Scout | Access Intelligence",
  description: "Review simulated Scout candidates.",
};

export default function Page() {
  return (
    <MapAbleCareMarketingShell>
      <PhysicalScoutClient />
    </MapAbleCareMarketingShell>
  );
}

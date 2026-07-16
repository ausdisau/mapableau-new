import type { Metadata } from "next";
import React from "react";

import { PhysicalHubClient } from "@/components/access-intelligence/physical/physical-hub-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";


export const metadata: Metadata = {
  title: "Physical Systems | Access Intelligence",
  description: "Harbour Physical Systems hub.",
};

export default function Page() {
  return (
    <MapAbleCareMarketingShell>
      <PhysicalHubClient />
    </MapAbleCareMarketingShell>
  );
}

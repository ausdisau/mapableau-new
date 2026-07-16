import type { Metadata } from "next";
import React from "react";

import { PhysicalVisitsClient } from "@/components/access-intelligence/physical/physical-visits-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";


export const metadata: Metadata = {
  title: "Physical visits | Access Intelligence",
  description: "Saved physical visit plans.",
};

export default function Page() {
  return (
    <MapAbleCareMarketingShell>
      <PhysicalVisitsClient />
    </MapAbleCareMarketingShell>
  );
}

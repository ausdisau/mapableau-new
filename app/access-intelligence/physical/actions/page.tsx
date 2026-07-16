import type { Metadata } from "next";
import React from "react";

import { PhysicalActionsClient } from "@/components/access-intelligence/physical/physical-actions-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";


export const metadata: Metadata = {
  title: "Physical actions | Access Intelligence",
  description: "Physical action history.",
};

export default function Page() {
  return (
    <MapAbleCareMarketingShell>
      <PhysicalActionsClient />
    </MapAbleCareMarketingShell>
  );
}

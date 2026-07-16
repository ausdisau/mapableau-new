import type { Metadata } from "next";
import React from "react";

import { PhysicalPassportClient } from "@/components/access-intelligence/physical/physical-passport-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";


export const metadata: Metadata = {
  title: "Physical Passport | Access Intelligence",
  description: "Select Access Passport for physical planning.",
};

export default function Page() {
  return (
    <MapAbleCareMarketingShell>
      <PhysicalPassportClient />
    </MapAbleCareMarketingShell>
  );
}

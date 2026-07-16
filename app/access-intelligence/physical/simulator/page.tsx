import type { Metadata } from "next";
import React from "react";

import { PhysicalSimulatorClient } from "@/components/access-intelligence/physical/physical-simulator-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";


export const metadata: Metadata = {
  title: "Physical simulator | Access Intelligence",
  description: "Harbour Physical Environment Simulator.",
};

export default function Page() {
  return (
    <MapAbleCareMarketingShell>
      <PhysicalSimulatorClient />
    </MapAbleCareMarketingShell>
  );
}

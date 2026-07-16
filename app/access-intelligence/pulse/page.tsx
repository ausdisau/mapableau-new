import type { Metadata } from "next";
import React from "react";

import { AccessPulseClient } from "@/components/access-intelligence/access-pulse";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Access Pulse | Access Intelligence",
  description: "Report temporary accessibility barriers with explicit approval.",
};

export default function AccessPulsePage() {
  return (
    <MapAbleCareMarketingShell>
      <AccessPulseClient />
    </MapAbleCareMarketingShell>
  );
}

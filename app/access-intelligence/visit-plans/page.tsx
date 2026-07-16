import type { Metadata } from "next";
import React from "react";

import { VisitPlansClient } from "@/components/access-intelligence/visit-plans-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Visit plans | Access Intelligence",
  description: "Saved visit plans with plain-language and map-free routes.",
};

export default function VisitPlansPage() {
  return (
    <MapAbleCareMarketingShell>
      <VisitPlansClient />
    </MapAbleCareMarketingShell>
  );
}

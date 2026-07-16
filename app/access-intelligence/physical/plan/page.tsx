import type { Metadata } from "next";
import React from "react";

import { PhysicalPlanClient } from "@/components/access-intelligence/physical/physical-plan-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Concierge plan | Access Intelligence",
  description: "Plan a Harbour Civic Centre visit with Physical Systems.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ passportId?: string }>;
}) {
  const params = await searchParams;
  return (
    <MapAbleCareMarketingShell>
      <PhysicalPlanClient initialPassportId={params.passportId} />
    </MapAbleCareMarketingShell>
  );
}

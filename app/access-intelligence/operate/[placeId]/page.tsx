import type { Metadata } from "next";
import React, { Suspense } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { OperateConsole } from "@/components/access-intelligence/living/operate-console";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

type Props = { params: Promise<{ placeId: string }> };

export const metadata: Metadata = {
  title: "Operate — Living Building | Access Intelligence",
};

export default async function OperatePage({ params }: Props) {
  const { placeId } = await params;
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Operate it"
        description="Live incidents, evidence gaps, temporary routes, and verification responses for authorised venue staff."
      >
        <Suspense fallback={<p role="status">Loading operations console…</p>}>
          <OperateConsole placeId={placeId} />
        </Suspense>
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}

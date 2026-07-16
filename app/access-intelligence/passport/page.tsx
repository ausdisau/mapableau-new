import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { AccessPassportEditor } from "@/components/access-intelligence/access-passport-editor";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Access Passports | Access Intelligence | MapAble",
  description:
    "Create and edit functional access requirements without diagnoses. Templates are starting points only.",
};

export default function AccessPassportPage() {
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Access Passports"
        description="Record functional access requirements — step-free routes, door widths, quiet spaces, communication preferences, and more. Never diagnosis-based."
      >
        <AccessPassportEditor />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}

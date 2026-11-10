import type { CSSProperties, ReactNode } from "react";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { careBlueprintCssVariables } from "@/lib/brand/care-blueprint-tokens";

export default function CareLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="care-blueprint-pilot"
      style={careBlueprintCssVariables as CSSProperties}
    >
      <MapAbleCareMarketingShell>{children}</MapAbleCareMarketingShell>
    </div>
  );
}

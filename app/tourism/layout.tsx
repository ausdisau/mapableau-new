import type { ReactNode } from "react";

import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { TourismShell } from "@/components/tourism/TourismShell";

export default function TourismLayout({ children }: { children: ReactNode }) {
  return (
    <MapAbleCareMarketingShell>
      <TourismShell>{children}</TourismShell>
    </MapAbleCareMarketingShell>
  );
}

"use client";

import type { ReactNode } from "react";

import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import {
  UnifiedParticipantMobileNav,
  UnifiedParticipantSidebar,
} from "@/components/layout/UnifiedParticipantNav";
import { MapAbleAppCompactHeader } from "@/components/marketing/MapAbleAppCompactHeader";
import { MapAbleCareSlimFooter } from "@/components/marketing/MapAbleCareMarketingFooter";
import { AgencyIndicator } from "@/components/personal-agency/AgencyIndicator";
import { SkipToContent } from "@/components/core/SkipToContent";
import { SidebarLayout } from "@mapable/ui";
import type { UserRole } from "@/types/mapable";

export function UnifiedParticipantShell({
  children,
  userName,
  role,
}: {
  children: ReactNode;
  userName: string;
  role: UserRole;
}) {
  return (
    <div
      className="mapable-soft min-h-screen bg-[#F6FBFC] text-[#0C1833]"
      data-testid="unified-participant-shell"
    >
      <SkipToContent />
      <SidebarLayout
        header={
          <MapAbleAppCompactHeader
            title="My MapAble"
            logoHref="/my"
            actions={
              <div className="flex items-center gap-3">
                <AgencyIndicator />
                <MapAbleUserBar userName={userName} role={role} />
              </div>
            }
          />
        }
        sidebar={<UnifiedParticipantSidebar />}
        mobileNav={<UnifiedParticipantMobileNav />}
      >
        {children}
      </SidebarLayout>
      <div className="hidden md:block">
        <MapAbleCareSlimFooter />
      </div>
    </div>
  );
}

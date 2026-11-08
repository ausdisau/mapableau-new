"use client";

import type { ReactNode } from "react";

import { DashboardNav } from "@/components/layout/DashboardNav";
import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import {
  ParticipantWorkspaceMobileNav,
  ParticipantWorkspaceSidebar,
} from "@/components/layout/ParticipantWorkspaceNav";
import { SkipToContent } from "@/components/core/SkipToContent";
import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";
import { MapAbleAppCompactHeader } from "@/components/marketing/MapAbleAppCompactHeader";
import { MapAbleCareSlimFooter } from "@/components/marketing/MapAbleCareMarketingFooter";
import { participantWorkspaceFlags } from "@/lib/config/participant-workspace";
import type { UserRole } from "@/types/mapable";
import { SidebarLayout } from "@mapable/ui";

export function DashboardAppShell({
  children,
  userName,
  role,
  showCareOsNav = false,
  showMapAbleIdNav = false,
}: {
  children: ReactNode;
  userName: string;
  role: UserRole;
  showCareOsNav?: boolean;
  showMapAbleIdNav?: boolean;
}) {
  const sidebarEnabled = participantWorkspaceFlags.sidebarEnabled();
  const showAdminLink = role === "mapable_admin";

  if (!sidebarEnabled) {
    return (
      <MapAbleAppShell
        variant="app"
        headerTitle="Dashboard"
        logoHref="/dashboard"
        headerActions={<MapAbleUserBar userName={userName} role={role} />}
        secondaryNav={
          <DashboardNav
            userName={userName}
            role={role}
            showCareOsNav={showCareOsNav}
            showMapAbleIdNav={showMapAbleIdNav}
          />
        }
      >
        {children}
      </MapAbleAppShell>
    );
  }

  // Sidebar layout owns the single main landmark — do not nest MapAbleAppShell.
  return (
    <div
      className="mapable-soft min-h-screen bg-[#F6FBFC] text-[#0C1833]"
      data-testid="participant-workspace-shell"
    >
      <SkipToContent />
      <SidebarLayout
        header={
          <MapAbleAppCompactHeader
            title="My Day"
            logoHref="/dashboard"
            actions={<MapAbleUserBar userName={userName} role={role} />}
          />
        }
        sidebar={
          <ParticipantWorkspaceSidebar
            showAdminLink={showAdminLink}
            showMapAbleIdNav={showMapAbleIdNav}
          />
        }
        mobileNav={
          <ParticipantWorkspaceMobileNav
            showAdminLink={showAdminLink}
            showMapAbleIdNav={showMapAbleIdNav}
          />
        }
      >
        {children}
      </SidebarLayout>
      <div className="hidden md:block">
        <MapAbleCareSlimFooter />
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";

import { SkipToContent } from "@/components/core/SkipToContent";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import {
  ParticipantWorkspaceMobileNav,
  ParticipantWorkspaceSidebar,
} from "@/components/layout/ParticipantWorkspaceNav";
import { OneAppShell } from "@/components/mapable-one";
import { MapAbleAppCompactHeader } from "@/components/marketing/MapAbleAppCompactHeader";
import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";
import { MapAbleCareSlimFooter } from "@/components/marketing/MapAbleCareMarketingFooter";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { isMapAbleOneUnifiedShellEnabled } from "@/lib/config/mapable-one-shell";
import { participantWorkspaceFlags } from "@/lib/config/participant-workspace";
import { CORE_ONE_NAV } from "@/lib/mapable-one/shell-nav";
import type { WorkspaceAvailability } from "@/lib/mapable-one/workspace-access";
import type { UserRole } from "@/types/mapable";
import { SidebarLayout } from "@mapable/ui";

function workspacesForRole(role: UserRole): WorkspaceAvailability[] {
  const canProvider = hasPermission(role, "care:read:org");
  const canWorker = hasPermission(role, "care:shift:work");
  const list: WorkspaceAvailability[] = [
    { id: "search", label: "MapAble Search", href: "/search", available: true },
    { id: "core", label: "MapAble Core", href: "/dashboard", available: true },
    {
      id: "provider",
      label: "MapAble Provider",
      href: "/provider",
      available: canProvider,
      reason: canProvider
        ? undefined
        : "Not available — requires an active provider organisation membership.",
    },
    {
      id: "worker",
      label: "MapAble Worker",
      href: "/worker/today",
      available: canWorker,
      reason: canWorker
        ? undefined
        : "Not available — requires an active worker profile affiliation.",
    },
  ];
  if (isAdminRole(role)) {
    list.push({
      id: "admin",
      label: "MapAble Admin",
      href: "/admin",
      available: true,
    });
  }
  return list;
}

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
  const oneShell = isMapAbleOneUnifiedShellEnabled();
  const sidebarEnabled = participantWorkspaceFlags.sidebarEnabled();
  const showAdminLink = role === "mapable_admin";

  if (oneShell) {
    return (
      <OneAppShell
        workspaces={workspacesForRole(role)}
        currentWorkspace="core"
        workspaceLabel="MapAble Core"
        contextLabel="My Day"
        userName={userName}
        logoHref="/dashboard"
        navLinks={CORE_ONE_NAV}
        headerActions={<MapAbleUserBar userName={userName} role={role} />}
        mobileLinks={CORE_ONE_NAV.slice(0, 4)}
      >
        {children}
      </OneAppShell>
    );
  }

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

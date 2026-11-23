"use client";

import type { ReactNode } from "react";

import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import { OneAppShell } from "@/components/mapable-one";
import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";
import { AgencyIndicator } from "@/components/personal-agency/AgencyIndicator";
import { MyMapAbleNav } from "@/components/personal-agency/MyMapAbleNav";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { isMapAbleOneUnifiedShellEnabled } from "@/lib/config/mapable-one-shell";
import type { OneNavLink } from "@/components/mapable-one";
import type { WorkspaceAvailability } from "@/lib/mapable-one/workspace-access";
import type { UserRole } from "@/types/mapable";

const MY_ONE_NAV: OneNavLink[] = [
  { href: "/my", label: "Home", exact: true },
  { href: "/dashboard", label: "My Day" },
  { href: "/care", label: "Care" },
  { href: "/dashboard/transport", label: "Transport" },
];

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

export function MyMapAbleAppShell({
  children,
  userName,
  role,
}: {
  children: ReactNode;
  userName: string;
  role: UserRole;
}) {
  if (isMapAbleOneUnifiedShellEnabled()) {
    return (
      <OneAppShell
        workspaces={workspacesForRole(role)}
        currentWorkspace="core"
        workspaceLabel="My MapAble"
        contextLabel="Personal agency"
        userName={userName}
        logoHref="/my"
        navLinks={MY_ONE_NAV}
        headerActions={
          <div className="flex items-center gap-3">
            <AgencyIndicator />
            <MapAbleUserBar userName={userName} role={role} />
          </div>
        }
        mobileLinks={MY_ONE_NAV}
      >
        {children}
      </OneAppShell>
    );
  }

  return (
    <MapAbleAppShell
      variant="app"
      headerTitle="My MapAble"
      logoHref="/my"
      headerActions={
        <div className="flex items-center gap-3">
          <AgencyIndicator />
          <MapAbleUserBar userName={userName} role={role} />
        </div>
      }
      secondaryNav={<MyMapAbleNav />}
    >
      <div className="pb-20 md:pb-0">{children}</div>
    </MapAbleAppShell>
  );
}

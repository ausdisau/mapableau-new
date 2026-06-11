"use client";

import type { ReactNode } from "react";

import { DashboardNav } from "@/components/layout/DashboardNav";
import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";
import type { Y1WedgeConfig } from "@/lib/config/y1-wedge";
import type { UserRole } from "@/types/mapable";

export function DashboardAppShell({
  children,
  userName,
  role,
  wedgeFlags,
}: {
  children: ReactNode;
  userName: string;
  role: UserRole;
  wedgeFlags: Y1WedgeConfig;
}) {
  return (
    <MapAbleAppShell
      variant="app"
      headerTitle="Dashboard"
      logoHref="/dashboard"
      headerActions={<MapAbleUserBar userName={userName} role={role} />}
      secondaryNav={
        <DashboardNav userName={userName} role={role} wedgeFlags={wedgeFlags} />
      }
    >
      {children}
    </MapAbleAppShell>
  );
}

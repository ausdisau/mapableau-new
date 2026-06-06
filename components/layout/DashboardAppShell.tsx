"use client";

import type { ReactNode } from "react";

import { DashboardNav } from "@/components/layout/DashboardNav";
import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";
import type { UserRole } from "@/types/mapable";

export function DashboardAppShell({
  children,
  userName,
  role,
}: {
  children: ReactNode;
  userName: string;
  role: UserRole;
}) {
  return (
    <MapAbleAppShell
      variant="app"
      headerTitle="Dashboard"
      headerActions={<MapAbleUserBar userName={userName} role={role} />}
      secondaryNav={<DashboardNav userName={userName} role={role} />}
    >
      {children}
    </MapAbleAppShell>
  );
}

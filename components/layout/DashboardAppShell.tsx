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
  email,
  avatarUrl = null,
}: {
  children: ReactNode;
  userName: string;
  role: UserRole;
  email?: string;
  avatarUrl?: string | null;
}) {
  return (
    <MapAbleAppShell
      variant="app"
      headerTitle="Dashboard"
      logoHref="/dashboard"
      headerActions={
        <MapAbleUserBar
          userName={userName}
          role={role}
          email={email}
          avatarUrl={avatarUrl}
        />
      }
      secondaryNav={<DashboardNav userName={userName} role={role} />}
    >
      {children}
    </MapAbleAppShell>
  );
}

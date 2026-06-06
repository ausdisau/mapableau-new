"use client";

import type { ReactNode } from "react";

import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";

export function MapAbleRoleAppShell({
  children,
  headerTitle,
  secondaryNav,
  headerActions,
}: {
  children: ReactNode;
  headerTitle: string;
  secondaryNav: ReactNode;
  headerActions?: ReactNode;
}) {
  return (
    <MapAbleAppShell
      variant="app"
      headerTitle={headerTitle}
      headerActions={headerActions}
      secondaryNav={secondaryNav}
    >
      {children}
    </MapAbleAppShell>
  );
}

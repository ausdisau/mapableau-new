"use client";

import type { ReactNode } from "react";

import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";
import { AgencyIndicator } from "@/components/personal-agency/AgencyIndicator";
import { MyMapAbleNav } from "@/components/personal-agency/MyMapAbleNav";
import type { UserRole } from "@/types/mapable";

export function MyMapAbleAppShell({
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

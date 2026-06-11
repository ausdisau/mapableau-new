"use client";

import { Suspense } from "react";

import { CoordinationDashboard } from "@/components/coordinate/CoordinationDashboard";
import {
  CoordinateParticipantSelector,
} from "@/components/coordinate/coordinate-client";
import { CoordinatePageHeader } from "@/components/coordinate/CoordinateShell";
import type { CoordinateDashboardPayload } from "@/lib/coordinate/types";

export function CoordinateHomeClient({
  dashboard,
  coordinatorParticipants,
  roleView,
  participantOptions,
}: {
  dashboard: CoordinateDashboardPayload;
  coordinatorParticipants: CoordinateDashboardPayload[];
  roleView: "participant" | "coordinator" | "admin";
  participantOptions: Array<{ participantId: string; participantName: string }>;
}) {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <CoordinatePageHeader
        title={
          roleView === "participant"
            ? "Your coordination home"
            : "Support coordinator cockpit"
        }
      />
      <Suspense fallback={null}>
        {roleView !== "participant" ? (
          <CoordinateParticipantSelector participants={participantOptions} />
        ) : null}
      </Suspense>
      <CoordinationDashboard
        dashboard={dashboard}
        coordinatorParticipants={coordinatorParticipants}
        roleView={roleView}
      />
    </div>
  );
}

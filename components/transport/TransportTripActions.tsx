"use client";

import { useRouter } from "next/navigation";

import { TransportTripActionDialogs } from "@/components/transport/TransportTripActionDialogs";
import type { TransportNextAction } from "@/types/transport";

export function TransportTripActions({
  tripId,
  actions,
}: {
  tripId: string;
  actions: TransportNextAction[];
}) {
  const router = useRouter();

  return (
    <TransportTripActionDialogs
      tripId={tripId}
      actions={actions}
      onComplete={() => router.refresh()}
    />
  );
}

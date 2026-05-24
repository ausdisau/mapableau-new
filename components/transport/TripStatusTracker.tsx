"use client";

import React from "react";

import { PlainLanguageStatusBadge } from "@/components/modules/PlainLanguageStatusBadge";
import { TRANSPORT_STATUS_LABELS } from "@/types/transport";
import type { TransportBookingStatus } from "@prisma/client";

const PROGRESS_ORDER: TransportBookingStatus[] = [
  "requested",
  "awaiting_operator_response",
  "operator_accepted",
  "driver_assigned",
  "confirmed",
  "driver_en_route",
  "arrived_for_pickup",
  "participant_on_board",
  "in_transit",
  "arrived_at_destination",
  "completed",
];

type TripStatusTrackerProps = {
  status: TransportBookingStatus;
  pickupAddress: string;
  dropoffAddress: string;
};

export function TripStatusTracker({
  status,
  pickupAddress,
  dropoffAddress,
}: TripStatusTrackerProps) {
  const label = TRANSPORT_STATUS_LABELS[status] ?? status;
  const idx = PROGRESS_ORDER.indexOf(status);

  return (
    <section aria-labelledby="trip-status-heading" className="space-y-4">
      <h2 id="trip-status-heading" className="font-heading text-xl font-semibold">
        Trip status
      </h2>
      <PlainLanguageStatusBadge
        label={label}
        tone={status === "completed" ? "success" : status === "cancelled" ? "danger" : "active"}
      />
      <ol className="space-y-2 text-sm" aria-label="Trip progress">
        <li>
          <strong>Pickup:</strong> {pickupAddress}
        </li>
        <li>
          <strong>Drop-off:</strong> {dropoffAddress}
        </li>
      </ol>
      {idx >= 0 ? (
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Step {idx + 1} of {PROGRESS_ORDER.length} in the standard trip journey.
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        A map view is available when live tracking is enabled for your operator.
      </p>
    </section>
  );
}

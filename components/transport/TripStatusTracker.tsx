import type { TransportBookingStatus } from "@prisma/client";

import { TRANSPORT_STATUS_LABELS } from "@/types/transport";

const STATUS_STEPS: TransportBookingStatus[] = [
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

export function TripStatusTracker({
  status,
}: {
  status: TransportBookingStatus;
}) {
  const currentIndex = STATUS_STEPS.indexOf(status);
  return (
    <ol className="space-y-2" aria-label="Trip status">
      {STATUS_STEPS.map((step, index) => {
        const isCurrent = step === status;
        const isComplete = currentIndex > index;
        return (
          <li
            key={step}
            className="rounded-lg border p-3 text-sm"
            aria-current={isCurrent ? "step" : undefined}
          >
            <span className="font-medium">{TRANSPORT_STATUS_LABELS[step]}</span>
            <span className="ml-2 text-muted-foreground">
              {isCurrent ? "Current" : isComplete ? "Completed" : "Upcoming"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

import type { TransportTripStatus } from "@prisma/client";

import { StatusBadge } from "@/components/ui/status-badge";
import { transportTripStatusLabel } from "@/lib/transport/transport-status-labels";

export function TransportTripStatusBadge({
  status,
}: {
  status: TransportTripStatus | string;
}) {
  const key = String(status);
  return (
    <StatusBadge
      status={key}
      label={transportTripStatusLabel(status)}
      className="normal-case"
    />
  );
}

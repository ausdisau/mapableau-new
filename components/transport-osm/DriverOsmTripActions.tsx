"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const DRIVER_TRANSITIONS: Record<string, string> = {
  driver_assigned: "vehicle_dispatched",
  vehicle_dispatched: "arrived_at_pickup",
  arrived_at_pickup: "passenger_onboard",
  passenger_onboard: "arrived_at_destination",
  arrived_at_destination: "completed",
};

const BUTTON_LABELS: Record<string, string> = {
  vehicle_dispatched: "Start trip — en route to pickup",
  arrived_at_pickup: "Arrived at pickup",
  passenger_onboard: "Passenger on board",
  arrived_at_destination: "Arrived at destination",
  completed: "Complete trip",
};

export function DriverOsmTripActions({
  transportBookingId,
  status,
}: {
  transportBookingId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const next = DRIVER_TRANSITIONS[status];
  const label = next ? BUTTON_LABELS[next] : null;

  if (!next || !label) return null;

  return (
    <Button
      type="button"
      variant="default"
      size="lg"
      className="min-h-12 w-full"
      loading={loading}
      onClick={async () => {
        setLoading(true);
        await fetch(`/api/transport/bookings/${transportBookingId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toStatus: next }),
        });
        setLoading(false);
        window.location.reload();
      }}
    >
      {label}
    </Button>
  );
}

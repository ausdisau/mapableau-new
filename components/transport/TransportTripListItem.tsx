import Link from "next/link";
import { KeyboardEvent, useCallback } from "react";

import { TransportTripStatusBadge } from "@/components/transport/TransportTripStatusBadge";
import type { TransportTripApiResponse } from "@/types/transport";

function formatAddress(label: string, suburb: string | null, address?: string) {
  if (address) return `${label}: ${address}`;
  return `${label}: ${suburb ?? "Location shared when trip is active"}`;
}

export function TransportTripListItem({
  response,
  selected,
  onSelect,
}: {
  response: TransportTripApiResponse;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { trip } = response;
  const when = new Date(trip.scheduledStart).toLocaleString("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect?.();
      }
    },
    [onSelect]
  );

  return (
    <Link
      href={`/dashboard/transport/${trip.id}`}
      data-trip-button={trip.id}
      role="option"
      aria-selected={selected ? "true" : "false"}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`block rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected ? "border-primary bg-primary/5" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TransportTripStatusBadge status={trip.status} />
        <time className="text-sm text-muted-foreground" dateTime={trip.scheduledStart}>
          {when}
        </time>
      </div>
      <p className="mt-2 text-sm">{formatAddress("From", trip.pickup.suburb, trip.pickup.address)}</p>
      <p className="text-sm">{formatAddress("To", trip.dropoff.suburb, trip.dropoff.address)}</p>
    </Link>
  );
}

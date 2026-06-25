"use client";

import Link from "next/link";

export function PlanAccessibleTransportButton({
  placeId,
  placeName,
}: {
  placeId: string;
  placeName: string;
}) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <h2 className="text-lg font-semibold">Plan accessible transport</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Book transport to {placeName} with access-aware drop-off notes and driver
        instructions from community data.
      </p>
      <Link
        href={`/dashboard/transport/new?placeId=${encodeURIComponent(placeId)}`}
        className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground"
      >
        Plan accessible trip
      </Link>
    </div>
  );
}

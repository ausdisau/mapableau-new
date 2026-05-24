import React from "react";
import Link from "next/link";

import type { ParticipantUpcomingBooking } from "@/types/participant-dashboard";

type UpcomingSupportCardProps = {
  bookings: ParticipantUpcomingBooking[];
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function UpcomingSupportCard({ bookings }: UpcomingSupportCardProps) {
  return (
    <section aria-labelledby="upcoming-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="upcoming-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          Upcoming support
        </h2>
        <Link
          href="/dashboard/bookings"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          All bookings
        </Link>
      </div>
      {bookings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          You have no upcoming bookings. When you request support, it will
          appear here with dates and status updates.
        </p>
      ) : (
        <ul className="space-y-2">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link
                href={`/dashboard/bookings/${booking.id}`}
                className="block rounded-xl border border-border/60 bg-card p-4 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="text-sm font-semibold text-foreground">
                  {booking.bookingType.replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatWhen(booking.requestedStart)} · {booking.status.replace(/_/g, " ")}
                </p>
                {booking.locationLabel ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {booking.locationLabel}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

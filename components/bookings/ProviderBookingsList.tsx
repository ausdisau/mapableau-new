import Link from "next/link";

import { BookingStatusPanel } from "@/components/bookings/BookingTimeline";

const BOOKING_TYPE_LABELS: Record<string, string> = {
  care: "Care support",
  transport: "Accessible transport",
  care_transport: "Care and transport linked",
};

type ProviderBookingRow = {
  id: string;
  bookingType: string;
  status: string;
  requestedStart: Date;
};

export function ProviderBookingsList({
  bookings,
}: {
  bookings: ProviderBookingRow[];
}) {
  return (
    <div className="space-y-6">
      {bookings.length === 0 ? (
        <p role="status" className="text-muted-foreground">
          No assigned bookings yet. New requests will appear here when a
          participant is matched to your organisation.
        </p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link
                href={`/provider/bookings/${booking.id}`}
                className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div>
                  <p className="font-medium">
                    {BOOKING_TYPE_LABELS[booking.bookingType] ??
                      booking.bookingType.replace("_", " + ")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(booking.requestedStart).toLocaleString("en-AU")}
                  </p>
                </div>
                <BookingStatusPanel status={booking.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

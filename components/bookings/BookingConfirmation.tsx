"use client";

import Link from "next/link";

export function BookingConfirmation({
  bookingId,
  conversationId,
}: {
  bookingId: string;
  conversationId?: string | null;
}) {
  return (
    <div
      className="rounded-lg border border-green-700 bg-green-50 p-6 dark:bg-green-950"
      role="status"
      aria-live="polite"
    >
      <h2 className="text-xl font-semibold">Booking submitted</h2>
      <p className="mt-2">
        Your request has been sent. You can track updates on the booking page.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/dashboard/bookings/${bookingId}`}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          View booking
        </Link>
        {conversationId && (
          <Link
            href={`/dashboard/messages?conversation=${conversationId}`}
            className="rounded-md border px-4 py-2 focus-visible:outline focus-visible:outline-2"
          >
            Open messages
          </Link>
        )}
      </div>
    </div>
  );
}

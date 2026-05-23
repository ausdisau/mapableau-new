import Link from "next/link";

export function BookingLinkedThreadHeader({
  bookingId,
  bookingType,
  bookingStatus,
}: {
  bookingId: string;
  bookingType?: string;
  bookingStatus?: string;
}) {
  return (
    <header className="border-b bg-muted/30 px-4 py-3">
      <p className="text-sm font-medium">Booking conversation</p>
      <p className="text-xs text-muted-foreground">
        Linked to booking{" "}
        <Link
          href={`/dashboard/bookings/${bookingId}`}
          className="underline focus-visible:outline focus-visible:outline-2"
        >
          {bookingId.slice(0, 8)}…
        </Link>
        {bookingType && ` · ${bookingType.replace("_", " + ")}`}
        {bookingStatus && ` · ${bookingStatus.replace(/_/g, " ")}`}
      </p>
    </header>
  );
}

import Link from "next/link";

import { BookingCalendar } from "@/components/admin-panels/participant/BookingCalendar";
import { requireParticipantPanel } from "@/lib/auth/panel-guards";
import { listParticipantBookings } from "@/lib/bookings/booking-panel-service";

export const metadata = { title: "Bookings | Participant admin" };

export default async function ParticipantBookingsPage() {
  const user = await requireParticipantPanel();
  const bookings = await listParticipantBookings(user);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Bookings</h1>
        <Link
          href="/dashboard/bookings/new"
          className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Request booking
        </Link>
      </header>
      <BookingCalendar bookings={bookings} />
    </div>
  );
}

import Link from "next/link";
import { format } from "date-fns";

import { PanelSection } from "@/components/admin-panels/PanelSection";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Booking, Organisation } from "@prisma/client";

type BookingWithOrg = Booking & {
  assignedOrganisation: Pick<Organisation, "id" | "name"> | null;
};

export function UpcomingSupports({ bookings }: { bookings: BookingWithOrg[] }) {
  return (
    <PanelSection title="Upcoming supports">
      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/participant/bookings`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 hover:border-primary/40"
              >
                <span className="font-medium">
                  {b.bookingType.replace("_", " + ")} ·{" "}
                  {format(new Date(b.requestedStart), "d MMM yyyy, h:mm a")}
                </span>
                <span className="flex items-center gap-2 text-sm">
                  {b.assignedOrganisation?.name ?? "Provider TBC"}
                  <StatusBadge status={b.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/participant/bookings"
        className="mt-3 inline-flex min-h-10 text-sm font-medium text-primary hover:underline"
      >
        View all bookings →
      </Link>
    </PanelSection>
  );
}

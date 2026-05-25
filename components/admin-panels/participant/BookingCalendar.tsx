import { format } from "date-fns";

import { PanelSection } from "@/components/admin-panels/PanelSection";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Booking, Organisation } from "@prisma/client";

type Row = Booking & {
  assignedOrganisation: Pick<Organisation, "name"> | null;
};

export function BookingCalendar({ bookings }: { bookings: Row[] }) {
  const byMonth = bookings.reduce<Record<string, Row[]>>((acc, b) => {
    const key = format(new Date(b.requestedStart), "MMMM yyyy");
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <PanelSection
      title="Booking calendar"
      description="Chronological view of your support bookings."
    >
      {Object.keys(byMonth).length === 0 ? (
        <p className="text-sm text-muted-foreground">No bookings yet.</p>
      ) : (
        Object.entries(byMonth).map(([month, rows]) => (
          <div key={month} className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground">{month}</h3>
            <ul className="mt-2 space-y-2">
              {rows.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <span>
                    {format(new Date(b.requestedStart), "EEE d MMM, h:mm a")} —{" "}
                    {b.bookingType}
                  </span>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </PanelSection>
  );
}

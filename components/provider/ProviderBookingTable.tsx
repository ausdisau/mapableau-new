import Link from "next/link";

import { bookingStatusLabel, toCoreBookingStatus } from "@/lib/domain/booking-status";

export type ProviderBookingRow = {
  id: string;
  bookingType: string;
  status: string;
  requestedStart: Date | string;
  participant?: { name: string } | null;
  accessibilitySummary?: string | null;
  conversations?: { id: string }[];
  invoices?: { id: string; status: string }[];
};

function sectionForStatus(status: string): string {
  const core = toCoreBookingStatus(status);
  if (core === "requested" || core === "provider_review") return "new";
  if (core === "accepted" || core === "in_progress") return "active";
  if (core === "completed") return "awaiting_invoice";
  if (core === "disputed") return "disputed";
  return "other";
}

export function ProviderBookingTable({
  bookings,
  emptyMessage = "No bookings in this section.",
}: {
  bookings: ProviderBookingRow[];
  emptyMessage?: string;
}) {
  if (!bookings.length) {
    return <p className="text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b">
            <th scope="col" className="p-2">
              Participant
            </th>
            <th scope="col" className="p-2">
              Type
            </th>
            <th scope="col" className="p-2">
              When
            </th>
            <th scope="col" className="p-2">
              Access needs
            </th>
            <th scope="col" className="p-2">
              Status
            </th>
            <th scope="col" className="p-2">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b">
              <td className="p-2">{b.participant?.name ?? "Participant"}</td>
              <td className="p-2">{b.bookingType.replace("_", " + ")}</td>
              <td className="p-2">
                {new Date(b.requestedStart).toLocaleString("en-AU")}
              </td>
              <td className="p-2 max-w-[12rem] truncate">
                {b.accessibilitySummary ?? "—"}
              </td>
              <td className="p-2">
                <span className="inline-block rounded border px-2 py-0.5 text-xs font-medium">
                  {bookingStatusLabel(b.status)}
                </span>
              </td>
              <td className="p-2">
                <Link
                  href={`/provider/bookings/${b.id}`}
                  className="mr-2 underline focus-visible:outline focus-visible:outline-2"
                >
                  Open
                </Link>
                {b.conversations?.[0]?.id && (
                  <Link
                    href={`/provider/messages?conversation=${b.conversations[0].id}`}
                    className="underline"
                  >
                    Messages
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function groupBookingsBySection(bookings: ProviderBookingRow[]) {
  const groups: Record<string, ProviderBookingRow[]> = {
    new: [],
    active: [],
    awaiting_invoice: [],
    disputed: [],
    other: [],
  };
  for (const b of bookings) {
    groups[sectionForStatus(b.status)].push(b);
  }
  return groups;
}

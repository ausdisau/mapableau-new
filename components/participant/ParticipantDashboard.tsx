import Link from "next/link";

import type { getParticipantDashboardData } from "@/lib/participants/participant-dashboard-service";

type DashboardData = Awaited<ReturnType<typeof getParticipantDashboardData>>;

export function ParticipantDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <p className="text-slate-700">
        Your home for finding support, managing bookings, and approving invoices.
      </p>

      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="text-lg font-semibold">
          Upcoming supports
        </h2>
        {data.upcomingBookings.length === 0 ? (
          <p className="text-sm text-slate-600 mt-2" role="status">
            No upcoming bookings yet.{" "}
            <Link href="/providers" className="text-blue-800 font-medium">
              Find a provider
            </Link>
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.upcomingBookings.map((b) => (
              <li
                key={b.id}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <Link href={`/bookings/${b.id}`} className="font-medium text-blue-900">
                  {b.assignedOrganisation?.name ?? "Support booking"}
                </Link>
                <p className="text-sm text-slate-600">
                  {new Date(b.requestedStart).toLocaleString("en-AU")} — {b.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="approvals-heading">
        <h2 id="approvals-heading" className="text-lg font-semibold">
          Pending approvals
        </h2>
        {data.pendingApprovals.length === 0 ? (
          <p className="text-sm text-slate-600 mt-2">Nothing waiting for your approval.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.pendingApprovals.map((inv) => (
              <li key={inv.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <Link href={`/invoices/${inv.id}`} className="font-medium">
                  Invoice review
                </Link>
                <p className="text-sm text-slate-700">
                  ${(inv.totalCents / 100).toFixed(2)} — please review line items
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="consent-heading">
        <h2 id="consent-heading" className="text-lg font-semibold">
          Consent summary
        </h2>
        {data.activeConsents.length === 0 ? (
          <p className="text-sm text-slate-600 mt-2">
            You have not shared data with providers yet.
          </p>
        ) : (
          <ul className="mt-2 text-sm text-slate-700 space-y-1">
            {data.activeConsents.map((c) => (
              <li key={c.id}>
                {c.grantedToOrganisation?.name ?? "Individual"} — {c.scope.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.unreadMessageCount > 0 ? (
        <p className="text-sm" role="status">
          <Link href="/messages" className="text-blue-800 font-medium">
            {data.unreadMessageCount} unread message
            {data.unreadMessageCount === 1 ? "" : "s"}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

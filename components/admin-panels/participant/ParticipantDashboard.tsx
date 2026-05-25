import Link from "next/link";

import { ActionQueueList } from "@/components/admin-panels/ActionQueueList";
import { PanelSection } from "@/components/admin-panels/PanelSection";
import { AccessNeedsSummary } from "@/components/admin-panels/participant/AccessNeedsSummary";
import { UpcomingSupports } from "@/components/admin-panels/participant/UpcomingSupports";
import type { getParticipantDashboard } from "@/lib/participants/participant-service";

type DashboardData = Awaited<ReturnType<typeof getParticipantDashboard>>;

export function ParticipantDashboard({ data }: { data: DashboardData }) {
  const queue = [
    {
      label: "Invoices awaiting approval",
      count: data.pendingInvoices,
      href: "/participant/invoices",
      urgent: data.pendingInvoices > 0,
    },
    {
      label: "Active consent records",
      count: data.activeConsents,
      href: "/participant/consent",
    },
    {
      label: "Open complaints",
      count: data.openComplaints,
      href: "/participant/complaints",
      urgent: data.openComplaints > 0,
    },
    {
      label: "Waitlist requests",
      count: data.waitlist,
      href: "/participant/waitlists",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold">Participant admin</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manage your supports, consent, bookings and safeguarding in one place.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PanelSection title="Action centre">
            <ActionQueueList items={queue} />
            <Link
              href="/participant/support"
              className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              Find a provider →
            </Link>
          </PanelSection>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <AccessNeedsSummary accessibility={data.accessibility} profile={data.profile} />
          <UpcomingSupports bookings={data.upcomingBookings} />
        </div>
      </div>
    </div>
  );
}

import { ActionQueueList } from "@/components/admin-panels/ActionQueueList";
import { PanelSection } from "@/components/admin-panels/PanelSection";
import type { getProviderDashboard } from "@/lib/providers/provider-service";

type Data = Awaited<ReturnType<typeof getProviderDashboard>>;

export function ProviderDashboard({ data }: { data: Data }) {
  const q = data.actionQueue;
  const items = [
    {
      label: "Bookings awaiting response",
      count: q.pendingBookings,
      href: "/provider/bookings",
      urgent: q.pendingBookings > 0,
    },
    { label: "Quote requests", count: q.openQuotes, href: "/provider/quotes" },
    { label: "Roster today", count: q.rosterToday, href: "/provider/roster" },
    {
      label: "Workforce verification pending",
      count: q.workforcePending,
      href: "/provider/workforce",
      urgent: q.workforcePending > 0,
    },
    { label: "Quality & safeguards", count: q.qualityOpen, href: "/provider/quality" },
    { label: "Service logs to review", count: q.serviceLogsReview, href: "/provider/service-logs" },
    { label: "Draft invoices", count: q.invoicesDraft, href: "/provider/invoices" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold">
          {data.org?.name ?? "Provider admin"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Operations console — roster, workforce screening, quality and bookings.
        </p>
        {data.org && !data.org.bookingEligible ? (
          <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900">
            This organisation is not booking eligible. Complete verification before accepting
            new bookings.
          </p>
        ) : null}
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <PanelSection title="Action queue">
          <ActionQueueList items={items} />
        </PanelSection>
        <PanelSection title="Services & capabilities">
          <ul className="space-y-2 text-sm">
            {data.org?.providerServices?.map((s) => (
              <li key={s.id} className="rounded-lg border border-border px-3 py-2">
                {s.name} · {s.supportCategory}
              </li>
            )) ?? (
              <li className="text-muted-foreground">No services configured.</li>
            )}
          </ul>
        </PanelSection>
      </div>
    </div>
  );
}

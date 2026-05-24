import {
  ProviderBookingTable,
  groupBookingsBySection,
} from "@/components/provider/ProviderBookingTable";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderBookingsPage() {
  const user = await requireAuth();
  const orgs = await prisma.organisationMember.findMany({
    where: { userId: user.id },
  });
  const orgIds = orgs.map((o) => o.organisationId);

  const bookings = await prisma.booking.findMany({
    where: { assignedOrganisationId: { in: orgIds } },
    orderBy: { requestedStart: "desc" },
    include: {
      participant: { select: { name: true } },
      conversations: { select: { id: true }, take: 1 },
      invoices: { select: { id: true, status: true }, take: 1 },
    },
  });

  const groups = groupBookingsBySection(bookings);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todays = bookings.filter((b) => {
    const d = new Date(b.requestedStart);
    return d >= today && d < tomorrow;
  });

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold">Provider bookings</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Today</h2>
        <ProviderBookingTable
          bookings={todays}
          emptyMessage="No bookings scheduled for today."
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">New requests</h2>
        <ProviderBookingTable bookings={groups.new} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Accepted / in progress</h2>
        <ProviderBookingTable bookings={groups.active} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Awaiting invoice</h2>
        <ProviderBookingTable bookings={groups.awaiting_invoice} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Disputed</h2>
        <ProviderBookingTable bookings={groups.disputed} />
      </section>
    </div>
  );
}

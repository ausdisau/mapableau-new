import { ProviderBookingsList } from "@/components/bookings/ProviderBookingsList";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderBookingsPage() {
  const user = await requireAuth();
  const orgs = await prisma.organisationMember.findMany({
    where: { userId: user.id },
  });
  const bookings = await prisma.booking.findMany({
    where: { assignedOrganisationId: { in: orgs.map((o) => o.organisationId) } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Provider bookings</h1>
        <p className="text-sm text-muted-foreground">
          Review and respond to booking requests assigned to your organisation.
        </p>
      </header>
      <ProviderBookingsList bookings={bookings} />
    </div>
  );
}

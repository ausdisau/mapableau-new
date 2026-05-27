import Link from "next/link";

import { ProviderTripDispatchPanel } from "@/components/transport/ProviderTripDispatchPanel";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { listProviderTrips } from "@/lib/transport/transport-trip-service";

export default async function ProviderTransportDispatchPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) {
    return (
      <p>You need to belong to a provider organisation to use dispatch.</p>
    );
  }

  const trips = await listProviderTrips(user, organisationId);
  const drivers = await prisma.transportDriver.findMany({
    where: { organisationId, active: true },
    select: { id: true, displayName: true },
  });
  const vehicles = await prisma.transportVehicle.findMany({
    where: { organisationId, active: true },
    select: { id: true, displayName: true },
  });

  return (
    <div className="space-y-4">
      <p>
        <Link href="/provider/transport" className="text-sm text-primary hover:underline">
          ← Transport
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-bold">Dispatch board</h1>
      <p className="text-sm text-muted-foreground">
        Human dispatch only — match suggestions are advisory. Assign verified
        drivers and vehicles that meet each participant&apos;s mobility needs.
      </p>
      {vehicles.length === 0 || drivers.length === 0 ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          role="status"
        >
          {vehicles.length === 0 && drivers.length === 0
            ? "Add fleet vehicles and drivers before you can assign trips."
            : vehicles.length === 0
              ? "No fleet vehicles — add at least one vehicle to assign trips."
              : "No fleet drivers — add at least one driver to assign trips."}{" "}
          <Link
            href="/provider/transport/fleet"
            className="font-medium underline"
          >
            Manage fleet
          </Link>
        </div>
      ) : null}
      <ProviderTripDispatchPanel
        organisationId={organisationId}
        initialTrips={trips}
        drivers={drivers}
        vehicles={vehicles}
      />
    </div>
  );
}

import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderVehiclesPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const vehicles = await prisma.vehicle.findMany({
    where: { organisationId: { in: orgIds } },
  });
  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
        For scheduled trip dispatch, manage your transport fleet (verified
        drivers and accessible vehicles) in{" "}
        <Link href="/provider/transport/fleet" className="text-primary hover:underline">
          Transport fleet
        </Link>
        . Legacy vehicles below are used by older transport bookings only.
      </p>
      <header className="flex justify-between">
        <h1 className="font-heading text-2xl font-bold">Vehicles</h1>
        <Link href="/provider/vehicles/new" className="text-primary underline">Add vehicle</Link>
      </header>
      <ul>
        {vehicles.map((v) => (
          <li key={v.id}>
            <Link href={`/provider/vehicles/${v.id}`}>{v.displayName}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

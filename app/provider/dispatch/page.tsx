import dynamic from "next/dynamic";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const DispatchMapPanel = dynamic(
  () =>
    import("@/components/dispatch/DispatchMapPanel").then(
      (m) => m.DispatchMapPanel
    ),
  { ssr: false }
);

export default async function ProviderDispatchPage() {
  const user = await requireAuth();
  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
  });
  const organisationId = membership?.organisationId;

  const transports = organisationId
    ? await prisma.transportBooking.findMany({
        where: {
          operatorOrganisationId: organisationId,
          pickupLat: { not: null },
          pickupLng: { not: null },
        },
        take: 20,
      })
    : [];

  const markers = transports.flatMap((t) => {
    const items = [];
    if (t.pickupLat != null && t.pickupLng != null) {
      items.push({
        id: `${t.id}-pickup`,
        lat: t.pickupLat,
        lng: t.pickupLng,
        label: "Pickup",
        variant: "pickup" as const,
      });
    }
    if (t.dropoffLat != null && t.dropoffLng != null) {
      items.push({
        id: `${t.id}-drop`,
        lat: t.dropoffLat,
        lng: t.dropoffLng,
        label: "Drop-off",
        variant: "dropoff" as const,
      });
    }
    return items;
  });

  const center =
    markers[0] != null
      ? { lat: markers[0].lat, lng: markers[0].lng }
      : { lat: -33.8688, lng: 151.2093 };

  return (
    <div className="container space-y-6 py-10">
      <h1 className="font-heading text-2xl font-bold">Provider dispatch</h1>
      <p className="text-muted-foreground">
        Active trips and assignments for your organisation. Assign workers and
        vehicles from the dispatch API.
      </p>
      <DispatchMapPanel markers={markers} center={center} />
      <p className="text-sm text-muted-foreground">
        {transports.length} active transport bookings with coordinates.
      </p>
    </div>
  );
}

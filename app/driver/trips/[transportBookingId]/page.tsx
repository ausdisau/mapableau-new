import { DriverTripMvpActions } from "@/components/transport-mvp/DriverTripMvpActions";
import { TransportTripMap } from "@/components/transport-mvp/TransportTripMap";
import { TripEvidenceForm } from "@/components/transport-mvp/TripEvidenceForm";
import { TripStatusStepper } from "@/components/transport-mvp/TripStatusStepper";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { buildAccessNeedsSummary } from "@/lib/transport-mvp/access-needs-summary";
import { getStopsForViewer } from "@/lib/transport-mvp/address-privacy";
import { getTransportDriverForUser } from "@/lib/transport-mvp/access-control";

export default async function DriverTripDetailPage({
  params,
}: {
  params: Promise<{ transportBookingId: string }>;
}) {
  const user = await requireAuth();
  const { transportBookingId } = await params;
  const driver = await getTransportDriverForUser(user.id);

  if (!driver) return <p role="alert">Driver profile not found.</p>;

  const trip = await prisma.transportTrip.findFirst({
    where: { id: transportBookingId, dispatch: { driverId: driver.id } },
    include: {
      request: true,
      stops: { orderBy: { sequence: "asc" } },
      accessNeeds: true,
      evidence: true,
      dispatch: { include: { vehicle: true } },
    },
  });
  if (!trip) return <p role="alert">Trip not found or not assigned to you.</p>;

  const stops = getStopsForViewer(trip.stops, "assigned_driver");
  const accessSummary = buildAccessNeedsSummary(trip.accessNeeds, {
    canViewDetail: trip.accessNeeds?.shareAccessibility ?? false,
  });

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold">Trip details</h2>

      <TripStatusStepper currentStatus={trip.status} />
      <TransportTripMap stops={stops} />

      <section className="rounded-xl border p-4 text-sm">
        <h3 className="font-semibold">Access needs</h3>
        <ul className="mt-2 list-disc pl-5">
          {accessSummary.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <p className="text-sm">
        <strong>Pickup:</strong> {stops.find((s) => s.stopType === "pickup")?.address}
      </p>
      <p className="text-sm">
        <strong>Drop-off:</strong> {stops.find((s) => s.stopType === "dropoff")?.address}
      </p>

      <TripEvidenceForm tripId={trip.id} />
      <DriverTripMvpActions tripId={trip.id} />
    </div>
  );
}

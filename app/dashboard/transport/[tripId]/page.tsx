import Link from "next/link";

import { VehicleSuitabilityWarning } from "@/components/phase3/VehicleSuitabilityWarning";
import { TransportRouteAdvisory } from "@/components/transport/TransportRouteAdvisory";
import { TransportTripDetailActions } from "@/components/transport/TransportTripDetailActions";
import { TransportTripStatusBadge } from "@/components/transport/TransportTripStatusBadge";
import { mobilityRequirementLabels, parseMobilityRequirements } from "@/lib/transport/mobility-schema";
import { requireAuth } from "@/lib/auth/guards";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { getTransportTripForUser } from "@/lib/transport/transport-trip-service";
import type { TransportAddressView } from "@/types/transport";

function formatLocation(label: string, location: TransportAddressView) {
  if (location.address) {
    const suburb = location.suburb ? ` (${location.suburb})` : "";
    return (
      <p>
        <span className="font-medium">{label}:</span> {location.address}
        {suburb}
      </p>
    );
  }
  return (
    <p>
      <span className="font-medium">{label}:</span>{" "}
      {location.suburb ?? "Location shared when trip is active"}
    </p>
  );
}

export default async function TransportTripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const user = await requireAuth();
  const { tripId } = await params;

  try {
    const response = await getTransportTripForUser(user, tripId);
    const {
      trip,
      nextActions,
      routeEstimate,
      suitabilityWarnings,
      handoverStatus,
      linkedBookingId,
    } = response;
    const mobilityLabels = mobilityRequirementLabels(
      parseMobilityRequirements(trip.mobilityRequirements)
    );
    const when = new Date(trip.scheduledStart).toLocaleString("en-AU", {
      dateStyle: "full",
      timeStyle: "short",
    });
    const endWhen = trip.scheduledEnd
      ? new Date(trip.scheduledEnd).toLocaleString("en-AU", {
          dateStyle: "full",
          timeStyle: "short",
        })
      : null;

    return (
      <div className="space-y-6">
        <p>
          <Link
            href="/dashboard/transport"
            className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            ← Back to transport trips
          </Link>
        </p>
        <header className="space-y-2">
          <h1 className="font-heading text-2xl font-bold">Transport trip</h1>
          <TransportTripStatusBadge status={trip.status} />
        </header>

        <section className="space-y-2 rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Schedule</h2>
          <p>
            <span className="font-medium">Start:</span> {when}
          </p>
          {endWhen ? (
            <p>
              <span className="font-medium">End:</span> {endWhen}
            </p>
          ) : null}
        </section>

        <section className="space-y-2 rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Locations</h2>
          {formatLocation("Pickup", trip.pickup)}
          {formatLocation("Drop-off", trip.dropoff)}
          {trip.pickup.accessNotes ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Access notes:</span>{" "}
              {trip.pickup.accessNotes}
            </p>
          ) : null}
        </section>

        {mobilityLabels.length > 0 ? (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold">Mobility requirements</h2>
            <ul className="mt-2 list-inside list-disc text-sm">
              {mobilityLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {suitabilityWarnings && suitabilityWarnings.length > 0 ? (
          <VehicleSuitabilityWarning warnings={suitabilityWarnings} />
        ) : null}

        {handoverStatus ? (
          <section className="rounded-xl border border-border bg-card p-4 text-sm space-y-1">
            <h2 className="font-semibold">Handover and safety checks</h2>
            <p>
              Pre-start check:{" "}
              {handoverStatus.preStartComplete ? "Complete" : "Pending"}
            </p>
            <p>
              Pickup handover:{" "}
              {handoverStatus.pickupHandoverComplete ? "Complete" : "Pending"}
            </p>
            <p>
              Drop-off handover:{" "}
              {handoverStatus.dropoffHandoverComplete ? "Complete" : "Pending"}
            </p>
          </section>
        ) : null}

        {linkedBookingId ? (
          <p className="text-sm">
            <span className="font-medium">NDIS booking link:</span>{" "}
            <Link
              href={`/dashboard/bookings/${linkedBookingId}`}
              className="text-primary hover:underline"
            >
              View linked booking (human approval required for claims)
            </Link>
          </p>
        ) : null}

        {trip.disputeReason ? (
          <p role="status" className="rounded-lg border border-border bg-muted p-3 text-sm">
            <span className="font-medium">Dispute reason:</span> {trip.disputeReason}
          </p>
        ) : null}

        {routeEstimate ? <TransportRouteAdvisory routeEstimate={routeEstimate} /> : null}

        <TransportTripDetailActions tripId={trip.id} actions={nextActions} />
        <p className="text-sm">
          <Link
            href="/dashboard/safety"
            className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Report a safety concern
          </Link>
        </p>
      </div>
    );
  } catch (e) {
    if (e instanceof TransportApiError) {
      return (
        <div className="space-y-4">
          <p role="alert">{e.message}</p>
          <Link
            href="/dashboard/transport"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to transport trips
          </Link>
        </div>
      );
    }
    throw e;
  }
}

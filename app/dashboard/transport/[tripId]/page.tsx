import Link from "next/link";

import { ModuleCheckoutButton } from "@/components/billing/ModuleCheckoutButton";
import { TransportRouteAdvisory } from "@/components/transport/TransportRouteAdvisory";
import { TransportTripActions } from "@/components/transport/TransportTripActions";
import { TransportTripStatusBadge } from "@/components/transport/TransportTripStatusBadge";
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
    const { trip, nextActions, routeEstimate } = response;
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

        {Object.keys(trip.mobilityRequirements).length > 0 ? (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold">Mobility requirements</h2>
            <ul className="mt-2 list-inside list-disc text-sm">
              {Object.entries(trip.mobilityRequirements).map(([key, value]) => (
                <li key={key}>
                  {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}:{" "}
                  {String(value)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {trip.disputeReason ? (
          <p role="status" className="rounded-lg border border-border bg-muted p-3 text-sm">
            <span className="font-medium">Dispute reason:</span> {trip.disputeReason}
          </p>
        ) : null}

        {routeEstimate ? <TransportRouteAdvisory routeEstimate={routeEstimate} /> : null}

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Billing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pay this transport trip securely in Stripe Checkout.
          </p>
          <div className="mt-3">
            <ModuleCheckoutButton endpoint={`/api/transport/trips/${trip.id}/checkout`} />
          </div>
        </section>

        <TransportTripActions tripId={trip.id} actions={nextActions} />
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

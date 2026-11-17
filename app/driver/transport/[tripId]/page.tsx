import Link from "next/link";

import { TransportEtaPilotPanel } from "@/components/transport/TransportEtaPilotPanel";
import { TransportLocationSharePanel } from "@/components/transport/TransportLocationSharePanel";
import { TransportTripStatusBadge } from "@/components/transport/TransportTripStatusBadge";
import { phase4Config } from "@/lib/config/phase4";
import { transportRoutingConfig } from "@/lib/config/transport-routing";
import { requireAuth } from "@/lib/auth/guards";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { getDriverTrip } from "@/lib/transport/transport-assignment-service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Driver transport trip | MapAble",
};

export default async function DriverTransportTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const user = await requireAuth();
  const { tripId } = await params;

  try {
    const response = await getDriverTrip(user, tripId);
    const { trip, routeEstimate } = response;
    const when = new Date(trip.scheduledStart).toLocaleString("en-AU", {
      timeZone: "Australia/Sydney",
      dateStyle: "full",
      timeStyle: "short",
    });

    return (
      <div className="space-y-6">
        <p>
          <Link
            href="/driver/transport"
            className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            ← Back to assigned transport trips
          </Link>
        </p>
        <header className="space-y-2">
          <h1 className="font-heading text-2xl font-bold">Transport trip</h1>
          <TransportTripStatusBadge status={trip.status} />
        </header>
        <section className="space-y-2 rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Schedule</h2>
          <p>{when}</p>
          <p>
            {trip.pickup.suburb ?? "Pickup"} → {trip.dropoff.suburb ?? "Drop-off"}
          </p>
        </section>
        <TransportEtaPilotPanel
          tripId={trip.id}
          initialEstimate={routeEstimate}
          enabled={transportRoutingConfig.etaPilotEnabled}
        />
        <TransportLocationSharePanel
          tripId={trip.id}
          role="driver"
          liveLocationEnabled={phase4Config.transportLiveLocationEnabled}
        />
      </div>
    );
  } catch (e) {
    if (e instanceof TransportApiError) {
      return (
        <div className="space-y-4">
          <p role="alert">{e.message}</p>
          <Link
            href="/driver/transport"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to assigned transport trips
          </Link>
        </div>
      );
    }
    throw e;
  }
}

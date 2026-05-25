import Link from "next/link";

import { AccessNeedsSummary } from "@/components/transport-mvp/AccessNeedsSummary";
import { TransportTripMap } from "@/components/transport-mvp/TransportTripMap";
import { TripStatusStepper } from "@/components/transport-mvp/TripStatusStepper";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { canShareAccessibilityWithOrganisation } from "@/lib/consent/consent-service";
import { buildAccessNeedsSummary } from "@/lib/transport-mvp/access-needs-summary";
import { getStopsForViewer } from "@/lib/transport-mvp/address-privacy";
import { getOrgTripDetail } from "@/lib/transport-mvp/provider-inbox-service";

export default async function ProviderTransportTripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const orgIds = await getUserOrganisationIds(user.id);

  let trip;
  try {
    trip = await getOrgTripDetail(id, orgIds);
  } catch {
    return <p role="alert">Trip not found.</p>;
  }

  const stops = getStopsForViewer(trip.stops, "provider_org");
  const canViewDetail = await canShareAccessibilityWithOrganisation(
    trip.participantId,
    trip.organisationId,
    "transport"
  );
  const accessSummary = buildAccessNeedsSummary(trip.accessNeeds, { canViewDetail });

  return (
    <div className="space-y-8">
      <header>
        <Link href="/provider/transport" className="text-sm text-primary hover:underline">
          Transport hub
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Trip</h1>
        <p className="text-sm text-muted-foreground">
          Participant: {trip.participant.name}
        </p>
      </header>

      <TripStatusStepper currentStatus={trip.status} />

      <TransportTripMap stops={stops} />

      <AccessNeedsSummary lines={accessSummary.lines} shared={accessSummary.shared} />

      {trip.dispatch ? (
        <section className="rounded-xl border p-4 text-sm">
          <h2 className="font-semibold">Dispatch</h2>
          <p>Driver: {trip.dispatch.driver.displayName}</p>
          <p>Vehicle: {trip.dispatch.vehicle.displayName}</p>
        </section>
      ) : (
        <Link
          href="/provider/transport/dispatch"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground"
        >
          Assign driver and vehicle
        </Link>
      )}

      {trip.evidence ? (
        <section className="rounded-xl border p-4 text-sm">
          <h2 className="font-semibold">Evidence</h2>
          <p>{trip.evidence.distanceKm} km · {trip.evidence.startedAt.toLocaleString("en-AU")}</p>
        </section>
      ) : null}

      {trip.participantDisputedAt ? (
        <p className="rounded-lg border border-amber-600/40 p-3 text-sm" role="alert">
          Disputed: {trip.disputeReason}
        </p>
      ) : null}
    </div>
  );
}

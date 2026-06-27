"use client";

import {
  computeTransportFeasibility,
  transportFeasibilityLabel,
} from "@/lib/wedges/transport/feasibility";
import type { AccessNeedProfile, ProviderTransportAccess } from "@/types/wedges";
import { TRANSPORT_DISCLAIMER } from "@/types/wedges";

type TransportAccessPanelProps = {
  transport: ProviderTransportAccess;
  participantNeeds?: AccessNeedProfile;
};

export function TransportAccessPanel({
  transport,
  participantNeeds = {},
}: TransportAccessPanelProps) {
  const feasibility = computeTransportFeasibility(transport, participantNeeds);
  const label = transportFeasibilityLabel(feasibility);

  return (
    <section aria-labelledby="transport-access-heading" className="space-y-4">
      <div>
        <h2 id="transport-access-heading" className="font-heading text-xl font-semibold">
          Getting there
        </h2>
        <p className="mt-1 text-sm font-medium">{label}</p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Accessible parking</dt>
          <dd>
            {transport.accessibleParking === true
              ? "Yes"
              : transport.accessibleParking === false
                ? "Not confirmed"
                : "Unknown"}
          </dd>
        </div>
        {transport.dropOffPoint ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Drop-off point</dt>
            <dd>{transport.dropOffPoint}</dd>
          </div>
        ) : null}
        {transport.nearestAccessiblePublicTransport ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Nearest accessible public transport</dt>
            <dd>{transport.nearestAccessiblePublicTransport}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-muted-foreground">Mobile provider option</dt>
          <dd>{transport.mobileProviderOption ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Telehealth option</dt>
          <dd>{transport.telehealthOption ? "Yes" : "No"}</dd>
        </div>
        {transport.recommendedArrivalBufferMinutes != null ? (
          <div>
            <dt className="text-muted-foreground">Suggested arrival buffer</dt>
            <dd>{transport.recommendedArrivalBufferMinutes} minutes</dd>
          </div>
        ) : null}
        {transport.supportWorkerMeetingPoint ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Meeting point</dt>
            <dd>{transport.supportWorkerMeetingPoint}</dd>
          </div>
        ) : null}
        {transport.routeNotes ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Route notes</dt>
            <dd>{transport.routeNotes}</dd>
          </div>
        ) : null}
      </dl>

      {transport.returnTripReminder ? (
        <p className="text-sm text-muted-foreground">{transport.returnTripReminder}</p>
      ) : null}

      <p className="text-xs text-muted-foreground" role="note">
        {TRANSPORT_DISCLAIMER}
      </p>

      <div className="flex flex-wrap gap-2">
        <a href="/dashboard/transport" className="text-sm text-primary underline">
          Plan accessible trip
        </a>
        <a href="/request-support" className="text-sm text-primary underline">
          Add transport to request
        </a>
      </div>
    </section>
  );
}

import type { TransportBookingStatus } from "@prisma/client";

import { TRANSPORT_STATUS_LABELS } from "@/types/transport-osm";

export function TripStatusTimeline({
  current,
  events,
}: {
  current: TransportBookingStatus;
  events?: Array<{ toStatus: TransportBookingStatus; createdAt: Date; reason?: string | null }>;
}) {
  return (
    <section aria-labelledby="trip-status-heading" className="space-y-3">
      <h2 id="trip-status-heading" className="text-lg font-semibold">
        Trip status
      </h2>
      <p className="text-sm">
        <span className="font-medium">Current: </span>
        {TRANSPORT_STATUS_LABELS[current]}
      </p>
      {events && events.length > 0 ? (
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {events.map((e, i) => (
            <li key={i}>
              <span className="font-medium">
                {TRANSPORT_STATUS_LABELS[e.toStatus]}
              </span>
              <span className="text-muted-foreground">
                {" "}
                — {new Date(e.createdAt).toLocaleString("en-AU")}
              </span>
              {e.reason ? (
                <span className="block text-muted-foreground">{e.reason}</span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

import type { TransportTripApiResponse } from "@/types/transport";

function formatSydney(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function sourceLabel(source?: string) {
  switch (source) {
    case "tomtom_orbis":
      return "TomTom Orbis";
    case "osrm":
      return "OSRM";
    case "mock":
      return "Sandbox";
    default:
      return source ?? "Unknown";
  }
}

function trafficKindLabel(routeEstimate: {
  liveTrafficUsed?: boolean;
  source?: string;
}) {
  if (routeEstimate.liveTrafficUsed) return "Live traffic included";
  if (routeEstimate.source === "mock") return "Sandbox — typical road speeds only";
  return "Not live traffic — typical road speeds only";
}

export function TransportRouteAdvisory({
  routeEstimate,
}: {
  routeEstimate: NonNullable<TransportTripApiResponse["routeEstimate"]>;
}) {
  const km = (routeEstimate.distanceMetres / 1000).toFixed(1);
  const totalMinutes = Math.round(routeEstimate.durationSeconds / 60);
  const travelMinutes = Math.round(
    (routeEstimate.travelDurationSeconds ?? routeEstimate.durationSeconds) / 60
  );
  const boardingMinutes = Math.round(
    (routeEstimate.boardingBufferSeconds ?? 0) / 60
  );
  const validUntil = formatSydney(routeEstimate.validUntil);
  const generatedAt = formatSydney(routeEstimate.generatedAt);
  const pickupEta = formatSydney(routeEstimate.pickupEta);
  const live = Boolean(routeEstimate.liveTrafficUsed);

  return (
    <section
      className="rounded-xl border border-border bg-muted/40 p-4"
      aria-labelledby="route-advisory-heading"
    >
      <h2 id="route-advisory-heading" className="font-semibold">
        Route estimate (advisory)
      </h2>
      <p
        className="mt-2 text-sm"
        role="status"
        aria-live="polite"
      >
        About {km} km. Travel about {travelMinutes} minutes
        {boardingMinutes > 0
          ? `, plus about ${boardingMinutes} minutes boarding time`
          : ""}
        . Combined about {totalMinutes} minutes.
      </p>
      {pickupEta ? (
        <p className="mt-2 text-sm">
          Advisory pickup time around {pickupEta} (Sydney). This is not a
          guaranteed arrival window.
        </p>
      ) : null}
      {boardingMinutes > 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Boarding time is extra time for getting in and settled. Extra boarding
          time is included when the trip mobility notes ask for it.
        </p>
      ) : null}
      <p className="mt-2 text-sm">
        Source: {sourceLabel(routeEstimate.source)} ({routeEstimate.provider}).{" "}
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              live ? "bg-emerald-700" : "bg-slate-500"
            }`}
          />
          <span>{trafficKindLabel(routeEstimate)}</span>
        </span>
      </p>
      {routeEstimate.fallbackReason ? (
        <p className="mt-2 text-sm">
          Using a backup estimate because:{" "}
          {routeEstimate.fallbackReason.replaceAll("_", " ")}.
        </p>
      ) : null}
      <p className="mt-2 text-sm text-muted-foreground">
        Freshness: generated {generatedAt ?? "just now"}
        {validUntil ? `; useful until ${validUntil}` : ""}. Times shown in
        Australia/Sydney.
      </p>
      <p className="mt-2 text-sm">{routeEstimate.advisoryDisclaimer}</p>
      {routeEstimate.hazards && routeEstimate.hazards.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold">Nearby road hazards</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Hazards are advisory. They do not change the travel-time number and
            do not cancel or reroute the trip.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {routeEstimate.hazards.map((hazard, index) => (
              <li key={hazard.id ?? `${hazard.headline ?? "hazard"}-${index}`}>
                {hazard.headline ?? hazard.category ?? "Road hazard"}
                {hazard.subCategory ? ` (${hazard.subCategory})` : ""}
                {hazard.distanceToRouteMetres != null
                  ? ` — about ${hazard.distanceToRouteMetres} m from the route`
                  : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

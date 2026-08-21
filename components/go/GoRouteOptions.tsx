"use client";

import type { AccessConfidenceLevel } from "@prisma/client";

import { AccessConfidenceBadge } from "@/components/access/AccessConfidenceBadge";
import type { RouteOption } from "@/lib/go/contracts/route-contracts";

export function GoRouteCard({
  route,
  selected,
  onSelect,
}: {
  route: RouteOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={`rounded-xl border p-4 ${selected ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
      aria-labelledby={`route-${route.routeId}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 id={`route-${route.routeId}-title`} className="font-semibold">
          {route.objective.replace(/_/g, " ")}
        </h3>
        <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
          {Math.round(route.accessibility.confidence * 100)}% confidence
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Distance</dt>
          <dd>{route.distanceMetres} m</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Duration</dt>
          <dd>~{route.durationMinutes} min</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Max gradient</dt>
          <dd>{route.accessibility.maximumSlopePercent.toFixed(1)}%</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Min width</dt>
          <dd>{route.accessibility.minimumWidthMm} mm</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Unknown segments</dt>
          <dd>{route.accessibility.unknownSegments}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Evidence coverage</dt>
          <dd>{Math.round(route.accessibility.evidenceCoverage * 100)}%</dd>
        </div>
      </dl>
      {route.warnings.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-amber-800 dark:text-amber-200">
          {route.warnings.slice(0, 3).map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm">{route.explanation}</p>
      <button
        type="button"
        className="mt-4 min-h-11 w-full rounded-lg bg-primary px-4 text-primary-foreground"
        onClick={onSelect}
        aria-pressed={selected}
      >
        {selected ? "Selected" : "Choose this route"}
      </button>
    </article>
  );
}

export function GoRouteOptions({
  routes,
  selectedRouteId,
  onSelect,
}: {
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelect: (routeId: string) => void;
}) {
  return (
    <section aria-labelledby="go-route-options-heading">
      <h2 id="go-route-options-heading" className="text-lg font-semibold">
        Route options
      </h2>
      <p className="text-sm text-muted-foreground">
        Compare trade-offs. You can travel through uncertain segments if you choose.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => (
          <GoRouteCard
            key={route.routeId}
            route={route}
            selected={selectedRouteId === route.routeId}
            onSelect={() => onSelect(route.routeId)}
          />
        ))}
      </div>
    </section>
  );
}

export function GoConfidencePanel({ route }: { route: RouteOption }) {
  return (
    <aside
      aria-labelledby="go-confidence-heading"
      className="rounded-xl border border-border bg-muted/40 p-4"
    >
      <h2 id="go-confidence-heading" className="font-semibold">
        Route confidence
      </h2>
      <dl className="mt-2 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Confidence</dt>
          <dd>{Math.round(route.accessibility.confidence * 100)}%</dd>
        </div>
        <div className="flex justify-between">
          <dt>Evidence coverage</dt>
          <dd>{Math.round(route.accessibility.evidenceCoverage * 100)}%</dd>
        </div>
        <div className="flex justify-between">
          <dt>Unknown segments</dt>
          <dd>{route.accessibility.unknownSegments}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Temporary barriers</dt>
          <dd>{route.accessibility.temporaryBarriers ?? 0}</dd>
        </div>
        {route.accessibility.lastVerified && (
          <div className="flex justify-between">
            <dt>Last verified</dt>
            <dd>{new Date(route.accessibility.lastVerified).toLocaleString()}</dd>
          </div>
        )}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        Unknown does not mean inaccessible. AI-inferred segments are never shown as independently
        verified.
      </p>
    </aside>
  );
}

export function GoDestinationAccess({
  destination,
}: {
  destination: {
    name: string;
    features: string[];
    confidence: AccessConfidenceLevel;
  } | null;
}) {
  if (!destination) return null;
  return (
    <section aria-labelledby="go-destination-access-heading" className="rounded-xl border p-4">
      <h2 id="go-destination-access-heading" className="font-semibold">
        Destination access
      </h2>
      <p className="mt-1 text-sm">{destination.name}</p>
      <div className="mt-2">
        <AccessConfidenceBadge level={destination.confidence} />
      </div>
      {destination.features.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {destination.features.map((f) => (
            <li key={f} className="rounded-md bg-muted px-2 py-1 text-xs">
              {f.replace(/_/g, " ")}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Limited entrance evidence for this place. Confirm accessible entrance on arrival.
        </p>
      )}
    </section>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

import type { PtCapabilities, PtDisruption, PtStop, PtTripPlan } from "@/lib/public-transport/types";

type PublicTransportPanelProps = {
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  wheelchairPreferred?: boolean;
};

type CapabilitiesResponse = {
  jurisdiction: string;
  capabilities: PtCapabilities;
};

type TripResponse = {
  jurisdiction: string;
  capabilities: PtCapabilities;
  plan?: PtTripPlan;
  error?: string;
  details?: { linkOutUrl?: string };
};

export function PublicTransportPanel({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  wheelchairPreferred = false,
}: PublicTransportPanelProps) {
  const [capabilities, setCapabilities] = useState<PtCapabilities | null>(null);
  const [jurisdiction, setJurisdiction] = useState<string | null>(null);
  const [nearbyStops, setNearbyStops] = useState<PtStop[]>([]);
  const [disruptions, setDisruptions] = useState<PtDisruption[]>([]);
  const [tripPlan, setTripPlan] = useState<PtTripPlan | null>(null);
  const [wheelchair, setWheelchair] = useState(wheelchairPreferred);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkOutUrl, setLinkOutUrl] = useState<string | null>(null);

  const hasCoords =
    pickupLat != null &&
    pickupLng != null &&
    dropoffLat != null &&
    dropoffLng != null;

  const loadData = useCallback(async () => {
    if (pickupLat == null || pickupLng == null) return;
    setLoading(true);
    setError(null);

    try {
      const capRes = await fetch(
        `/api/transport/pt/capabilities?lat=${pickupLat}&lng=${pickupLng}`
      );
      if (!capRes.ok) throw new Error("Could not load public transport capabilities");
      const capData = (await capRes.json()) as CapabilitiesResponse;
      setCapabilities(capData.capabilities);
      setJurisdiction(capData.jurisdiction);
      setLinkOutUrl(capData.capabilities.linkOutUrl);

      const coordRes = await fetch(
        `/api/transport/pt/coord?lat=${pickupLat}&lng=${pickupLng}&jurisdiction=${capData.jurisdiction}`
      );
      if (coordRes.ok) {
        const coordData = await coordRes.json();
        setNearbyStops(coordData.stops ?? []);
      }

      const disRes = await fetch(
        `/api/transport/pt/disruptions?jurisdiction=${capData.jurisdiction}&lat=${pickupLat}&lng=${pickupLng}`
      );
      if (disRes.ok) {
        const disData = await disRes.json();
        setDisruptions((disData.disruptions ?? []).slice(0, 5));
      }

      if (hasCoords && capData.capabilities.tripPlanning) {
        const tripRes = await fetch(
          `/api/transport/pt/trip?jurisdiction=${capData.jurisdiction}` +
            `&originLat=${pickupLat}&originLng=${pickupLng}` +
            `&destinationLat=${dropoffLat}&destinationLng=${dropoffLng}` +
            `&wheelchair=${wheelchair ? "true" : "false"}&maxTrips=3`
        );
        if (tripRes.ok) {
          const tripData = (await tripRes.json()) as TripResponse;
          setTripPlan(tripData.plan ?? null);
        } else {
          const errData = (await tripRes.json()) as TripResponse;
          setLinkOutUrl(errData.details?.linkOutUrl ?? capData.capabilities.linkOutUrl);
        }
      } else {
        setTripPlan(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load public transport data");
    } finally {
      setLoading(false);
    }
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, hasCoords, wheelchair]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (pickupLat == null || pickupLng == null) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <h2 className="font-semibold text-foreground">Public transport options</h2>
        <p className="mt-2">
          Exact pickup coordinates are needed to show nearby stops and journey alternatives.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="public-transport-heading"
      className="space-y-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="public-transport-heading" className="font-semibold">
            Public transport options
          </h2>
          {jurisdiction ? (
            <p className="text-sm text-muted-foreground">
              {jurisdiction} ·{" "}
              {capabilities?.tripPlanning
                ? "Trip planning available"
                : "Departures and disruptions only"}
            </p>
          ) : null}
        </div>
        {capabilities?.tripPlanning ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={wheelchair}
              onChange={(e) => setWheelchair(e.target.checked)}
            />
            Wheelchair-accessible only
          </label>
        ) : null}
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {tripPlan && tripPlan.options.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Suggested journeys</h3>
          {tripPlan.options.map((option, i) => (
            <article key={i} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">
                {option.durationMinutes != null ? `${option.durationMinutes} min` : "Journey"}{" "}
                {option.wheelchairAccessible ? "· Accessible" : null}
              </p>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                {option.legs.map((leg, j) => (
                  <li key={j}>
                    {leg.mode}: {leg.origin} → {leg.destination}
                    {leg.isOnDemand ? " (On Demand — book separately)" : null}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      ) : null}

      {nearbyStops.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium">Nearest stops</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {nearbyStops.slice(0, 5).map((stop) => (
              <li key={stop.id}>
                {stop.name}
                {stop.distanceMetres != null
                  ? ` (${Math.round(stop.distanceMetres)} m)`
                  : null}
                {stop.wheelchairAccessible === true ? " · Accessible" : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {disruptions.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium">Service notices</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {disruptions.map((d, i) => (
              <li key={d.id ?? i}>
                {d.url ? (
                  <a href={d.url} className="text-primary underline" target="_blank" rel="noreferrer">
                    {d.headline}
                  </a>
                ) : (
                  d.headline
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {linkOutUrl ? (
        <p>
          <a
            href={linkOutUrl}
            className="text-sm font-medium text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            Open official journey planner
          </a>
        </p>
      ) : null}

      {capabilities?.disclaimer ? (
        <p className="text-xs text-muted-foreground" role="note">
          {capabilities.disclaimer}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void loadData()}
        className="text-sm text-primary underline"
        disabled={loading}
      >
        Refresh
      </button>
    </section>
  );
}

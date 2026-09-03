"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { GoRouteOptions } from "@/components/go/GoRouteOptions";
import { GoSearch } from "@/components/go/GoSearch";
import type { RouteOption } from "@/lib/go/contracts/route-contracts";
import { defaultPowerWheelchairProfile } from "@/lib/go/profile-service";

type PlaceResult = {
  id: string;
  name: string;
  suburb: string | null;
  latitude?: number;
  longitude?: number;
};

export type GoAccessHandoff = {
  destinationPlaceId?: string;
  destinationName?: string;
  stepFreeRequired?: boolean;
  maxGradientPercent?: number;
  minPathWidthMm?: number;
  journeyOverride?: boolean;
  sandbox?: boolean;
};

export function GoRoutePlanner({
  initialPlaces,
  accessHandoff,
}: {
  initialPlaces: PlaceResult[];
  accessHandoff?: GoAccessHandoff | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(accessHandoff?.destinationName ?? "");
  const [places] = useState(initialPlaces);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(() => {
    if (!accessHandoff?.destinationPlaceId) return null;
    return (
      initialPlaces.find((p) => p.id === accessHandoff.destinationPlaceId) ?? {
        id: accessHandoff.destinationPlaceId,
        name: accessHandoff.destinationName ?? "Selected place",
        suburb: null,
      }
    );
  });
  const [origin, setOrigin] = useState({ lat: -33.883, lng: 151.205 });
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationSessionId, setLocationSessionId] = useState<string | null>(null);
  const [prefsConfirmed, setPrefsConfirmed] = useState(!accessHandoff?.destinationPlaceId);

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places.slice(0, 20);
    return places
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.suburb?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 20);
  }, [places, query]);

  useEffect(() => {
    fetch("/api/go/profile")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }, []);

  const requestLocationConsent = useCallback(async () => {
    const res = await fetch("/api/go/location/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purpose: "current_location",
        precision: "coarse",
        consentGranted: true,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setLocationSessionId(data.sessionId);
    }
  }, []);

  async function planRoutes() {
    if (!selectedPlace?.latitude || !selectedPlace?.longitude) {
      setError("Selected place needs a published location.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (!locationSessionId) await requestLocationConsent();

      const res = await fetch("/api/go/routes/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originLat: origin.lat,
          originLng: origin.lng,
          destinationPlaceId: selectedPlace.id,
          destinationLat: selectedPlace.latitude,
          destinationLng: selectedPlace.longitude,
          profile: defaultPowerWheelchairProfile(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? data.error ?? "Route planning unavailable");
        return;
      }

      const data = await res.json();
      setRoutes(data.routes ?? []);
      setPlanId(data.planId);
      if (data.routes?.[0]) setSelectedRouteId(data.routes[0].routeId);
    } catch {
      setError("Could not plan routes. MapAble Go may be disabled in this environment.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmRoute() {
    if (!planId || !selectedRouteId) return;
    await fetch(`/api/go/routes/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedRouteId }),
    });
    router.push(`/go/route/${planId}?routeId=${selectedRouteId}`);
  }

  return (
    <div className="space-y-8">
      {accessHandoff?.sandbox || accessHandoff?.destinationPlaceId ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
          role="status"
        >
          <p className="font-semibold">Pilot sandbox routing</p>
          <p className="mt-1">
            MapAble Go uses a pilot sandbox graph. It is not live national accessibility
            routing. Routes are not guaranteed accessible, and this is not a &quot;safe&quot; or
            &quot;verified accessible&quot; journey.
          </p>
          {(accessHandoff?.stepFreeRequired ||
            accessHandoff?.maxGradientPercent != null ||
            accessHandoff?.minPathWidthMm != null ||
            accessHandoff?.journeyOverride) && (
            <fieldset className="mt-3 space-y-2">
              <legend className="font-medium">Review routing preferences from Access</legend>
              <ul className="list-disc pl-5">
                {accessHandoff?.stepFreeRequired ? <li>Step-free preferred</li> : null}
                {accessHandoff?.maxGradientPercent != null ? (
                  <li>Max gradient {accessHandoff.maxGradientPercent}%</li>
                ) : null}
                {accessHandoff?.minPathWidthMm != null ? (
                  <li>Min path width {accessHandoff.minPathWidthMm} mm</li>
                ) : null}
                {accessHandoff?.journeyOverride ? (
                  <li>Journey override was active on Access</li>
                ) : null}
              </ul>
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={prefsConfirmed}
                  onChange={(e) => setPrefsConfirmed(e.target.checked)}
                />
                I have reviewed these routing preferences before planning
              </label>
            </fieldset>
          )}
        </div>
      ) : null}

      <GoSearch query={query} onQueryChange={setQuery} onSearch={() => undefined} />

      <section aria-labelledby="go-places-heading">
        <h2 id="go-places-heading" className="text-lg font-semibold">
          Choose destination
        </h2>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto" role="listbox" aria-label="Places">
          {filteredPlaces.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                role="option"
                aria-selected={selectedPlace?.id === place.id}
                className={`min-h-11 w-full rounded-lg border px-3 py-2 text-left ${selectedPlace?.id === place.id ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setSelectedPlace(place)}
              >
                <span className="font-medium">{place.name}</span>
                {place.suburb && (
                  <span className="ml-2 text-sm text-muted-foreground">{place.suburb}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="go-origin-heading">
        <h2 id="go-origin-heading" className="text-lg font-semibold">
          Starting point
        </h2>
        <p className="text-sm text-muted-foreground">
          Default: Central Station forecourt (pilot sandbox). Location used only for this planning
          session with your consent.
        </p>
        <div className="mt-2 grid max-w-md grid-cols-2 gap-2">
          <label className="text-sm">
            Latitude
            <input
              type="number"
              step="0.0001"
              className="mt-1 min-h-11 w-full rounded-lg border px-3"
              value={origin.lat}
              onChange={(e) => setOrigin((o) => ({ ...o, lat: Number(e.target.value) }))}
            />
          </label>
          <label className="text-sm">
            Longitude
            <input
              type="number"
              step="0.0001"
              className="mt-1 min-h-11 w-full rounded-lg border px-3"
              value={origin.lng}
              onChange={(e) => setOrigin((o) => ({ ...o, lng: Number(e.target.value) }))}
            />
          </label>
        </div>
      </section>

      <button
        type="button"
        className="min-h-11 rounded-lg bg-primary px-6 text-primary-foreground disabled:opacity-50"
        disabled={loading || !selectedPlace || !prefsConfirmed}
        onClick={planRoutes}
      >
        {loading ? "Planning routes…" : "Plan routes (sandbox)"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {routes.length > 0 && (
        <>
          <GoRouteOptions
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelect={setSelectedRouteId}
          />
          <button
            type="button"
            className="min-h-11 rounded-lg border-2 border-primary px-6 font-semibold text-primary"
            onClick={confirmRoute}
          >
            Continue with selected route
          </button>
        </>
      )}
    </div>
  );
}

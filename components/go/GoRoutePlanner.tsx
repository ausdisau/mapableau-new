"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { GoRouteOptions } from "@/components/go/GoRouteOptions";
import { GoSearch } from "@/components/go/GoSearch";
import { GO_SANDBOX_DISCLAIMER } from "@/lib/access/experience/go-handoff";
import type {
  MobilityRoutingProfile,
  RouteOption,
} from "@/lib/go/contracts/route-contracts";
import { defaultPowerWheelchairProfile } from "@/lib/go/profile-service";

type PlaceResult = {
  id: string;
  name: string;
  suburb: string | null;
  latitude?: number;
  longitude?: number;
};

function profileFromSearchParams(
  params: URLSearchParams,
): MobilityRoutingProfile {
  const base = defaultPowerWheelchairProfile();
  const aid = params.get("mobilityAidType");
  if (
    aid === "manual_wheelchair" ||
    aid === "power_wheelchair" ||
    aid === "mobility_scooter" ||
    aid === "other"
  ) {
    base.mobilityAidType = aid;
  }
  const pathWidth = params.get("minimumPreferredPathWidthMm");
  if (pathWidth) base.minimumPreferredPathWidthMm = Number(pathWidth);
  const slope = params.get("preferredMaximumSlopePercent");
  if (slope) base.preferredMaximumSlopePercent = Number(slope);
  if (params.get("curbRampRequired") === "1") base.curbRampRequired = true;
  if (params.get("liftRequirement") === "1") base.liftRequirement = true;
  if (params.get("accessibleToiletPreference") === "1") {
    base.accessibleToiletPreference = true;
  }
  if (params.get("stairsAllowed") === "0") base.stairsAllowed = false;
  return base;
}

export function GoRoutePlanner({ initialPlaces }: { initialPlaces: PlaceResult[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [places] = useState(initialPlaces);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [origin, setOrigin] = useState({ lat: -33.883, lng: 151.205 });
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationSessionId, setLocationSessionId] = useState<string | null>(null);
  const [profile, setProfile] = useState<MobilityRoutingProfile>(() =>
    defaultPowerWheelchairProfile(),
  );
  const [prefsReviewed, setPrefsReviewed] = useState(false);

  const sandboxHandoff =
    searchParams.get("sandbox") === "1" ||
    searchParams.get("reviewPreferences") === "1" ||
    Boolean(searchParams.get("destinationPlaceId"));

  useEffect(() => {
    const destinationId = searchParams.get("destinationPlaceId");
    if (destinationId) {
      const match = places.find((p) => p.id === destinationId);
      if (match) setSelectedPlace(match);
    }
    if (sandboxHandoff) {
      setProfile(profileFromSearchParams(searchParams));
    }
  }, [places, searchParams, sandboxHandoff]);

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
    if (sandboxHandoff && !prefsReviewed) {
      setError("Review your mobility preferences before planning a route.");
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
          profile,
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
      {sandboxHandoff ? (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
          role="note"
        >
          <p className="font-semibold">Sandbox journey handoff</p>
          <p className="mt-1">{GO_SANDBOX_DISCLAIMER}</p>
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

      {sandboxHandoff ? (
        <section
          aria-labelledby="go-prefs-heading"
          className="rounded-xl border border-border p-4"
        >
          <h2 id="go-prefs-heading" className="text-lg font-semibold">
            Review mobility preferences
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Routing-relevant preferences only — no health or diagnosis data is
            shared. Confirm before planning.
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Mobility aid</dt>
              <dd>{profile.mobilityAidType ?? "not set"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Preferred path width</dt>
              <dd>
                {profile.minimumPreferredPathWidthMm != null
                  ? `${profile.minimumPreferredPathWidthMm} mm`
                  : "not set"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Preferred max slope</dt>
              <dd>
                {profile.preferredMaximumSlopePercent != null
                  ? `${profile.preferredMaximumSlopePercent}%`
                  : "not set"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Kerb ramp</dt>
              <dd>{profile.curbRampRequired ? "Required" : "Not required"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Lift</dt>
              <dd>{profile.liftRequirement ? "Preferred" : "Not required"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Stairs</dt>
              <dd>{profile.stairsAllowed === false ? "Avoid" : "Allowed"}</dd>
            </div>
          </dl>
          <label className="mt-4 flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={prefsReviewed}
              onChange={(e) => setPrefsReviewed(e.target.checked)}
            />
            I have reviewed these preferences for this journey
          </label>
        </section>
      ) : null}

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
        disabled={loading || !selectedPlace || (sandboxHandoff && !prefsReviewed)}
        onClick={planRoutes}
      >
        {loading ? "Planning routes…" : "Plan accessible routes"}
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

"use client";

import type { AccessConfidenceLevel } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

import { GoAccessConditions } from "@/components/go/GoAccessConditions";
import {
  GoAccessibilitySummary,
  GoAssistancePanel,
  GoBarrierReport,
  GoInputModeIndicator,
} from "@/components/go/GoBarrierReport";
import { GoMap } from "@/components/go/GoMap";
import {
  GoConfidencePanel,
  GoDestinationAccess,
} from "@/components/go/GoRouteOptions";
import { GoListView, GoRouteSteps } from "@/components/go/GoRouteSteps";
import type { RouteOption } from "@/lib/go/contracts/route-contracts";

type ViewMode = "guided" | "list" | "map";

export function GoRouteDetailClient({
  planId,
  initialRouteId,
}: {
  planId: string;
  initialRouteId?: string;
}) {
  const [mode, setMode] = useState<ViewMode>("guided");
  const [stepIndex, setStepIndex] = useState(0);
  const [route, setRoute] = useState<RouteOption | null>(null);
  const [destination, setDestination] = useState<{
    name: string;
    features: string[];
    confidence: AccessConfidenceLevel;
  } | null>(null);
  const [places, setPlaces] = useState<
    Array<{ id: string; name: string; latitude?: number; longitude?: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/go/routes/${planId}`);
      if (!res.ok) {
        setError("Route plan not found or MapAble Go is disabled.");
        return;
      }
      const data = await res.json();
      const rid = initialRouteId ?? data.selectedRouteId ?? data.routes?.[0]?.routeId;
      const selected = (data.routes as RouteOption[])?.find((r) => r.routeId === rid) ??
        data.routes?.[0];
      setRoute(selected ?? null);
      if (data.destination) setDestination(data.destination);
    } finally {
      setLoading(false);
    }
  }, [planId, initialRouteId]);

  useEffect(() => {
    loadPlan();
    fetch("/api/access/places")
      .then((r) => r.json())
      .then((d) => setPlaces(d.places ?? []))
      .catch(() => undefined);
  }, [loadPlan]);

  async function reroute() {
    const res = await fetch(`/api/go/routes/${planId}/reroute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originLat: -33.883, originLng: 151.205 }),
    });
    if (res.ok) {
      const data = await res.json();
      setRoute(data.routes?.[0] ?? null);
      setStepIndex(0);
    }
  }

  if (loading) return <p>Loading route…</p>;
  if (error || !route) return <p role="alert">{error ?? "No route selected."}</p>;

  return (
    <div className="space-y-6">
      <nav aria-label="Interface mode" className="flex flex-wrap gap-2">
        {(["guided", "list", "map"] as ViewMode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`min-h-11 rounded-lg px-4 capitalize ${mode === m ? "bg-primary text-primary-foreground" : "border"}`}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
          >
            {m} mode
          </button>
        ))}
      </nav>

      <GoInputModeIndicator mode={mode} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {mode === "guided" && (
            <GoRouteSteps
              route={route}
              mode="guided"
              stepIndex={stepIndex}
              onStepChange={setStepIndex}
            />
          )}
          {mode === "list" && (
            <GoListView
              route={route}
              mode="list"
              stepIndex={0}
              onStepChange={() => undefined}
            />
          )}
          {mode === "map" && <GoMap route={route} places={places} />}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="min-h-11 rounded-lg border px-4" onClick={reroute}>
              Reroute
            </button>
          </div>

          <GoBarrierReport segmentIds={route.segmentIds} onReported={loadPlan} />
        </div>

        <div className="space-y-4">
          <GoConfidencePanel route={route} />
          <GoAccessibilitySummary route={route} />
          <GoAccessConditions />
          <GoDestinationAccess destination={destination} />
          <GoAssistancePanel />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

type FloorPlanMarker = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  xPercent: number;
  yPercent: number;
  confidence: string;
  severity?: string | null;
};

export function AccessFloorPlanViewer({
  floorPlan,
}: {
  floorPlan: {
    title: string;
    levelLabel?: string | null;
    assetUrl: string;
    mimeType: string;
    altText: string;
    publicNotes?: string | null;
    markers: FloorPlanMarker[];
  };
}) {
  const [selectedMarkerId, setSelectedMarkerId] = useState(
    floorPlan.markers[0]?.id ?? "",
  );
  const [zoom, setZoom] = useState(1);
  const selectedMarker = useMemo(
    () => floorPlan.markers.find((m) => m.id === selectedMarkerId),
    [floorPlan.markers, selectedMarkerId],
  );
  const isImage = floorPlan.mimeType.startsWith("image/");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="floor-plan-heading" className="space-y-3">
        <div>
          <h1 id="floor-plan-heading" className="text-2xl font-bold">
            {floorPlan.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {floorPlan.levelLabel ?? "Venue floor plan"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-lg border border-border px-3 text-sm"
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
          >
            Zoom out
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-border px-3 text-sm"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          >
            Zoom in
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-border px-3 text-sm"
            onClick={() => setZoom(1)}
          >
            Reset
          </button>
          <a
            href={floorPlan.assetUrl}
            className="min-h-11 rounded-lg border border-border px-3 py-2 text-sm"
          >
            Open original
          </a>
        </div>

        {isImage ? (
          <div
            className="max-h-[70vh] overflow-auto rounded-lg border border-border bg-muted"
            role="region"
            aria-label="Interactive floor plan image"
          >
            <div
              className="relative origin-top-left"
              style={{ width: `${zoom * 100}%` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={floorPlan.assetUrl}
                alt={floorPlan.altText}
                className="block h-auto w-full select-none"
              />
              {floorPlan.markers.map((marker, index) => (
                <button
                  key={marker.id}
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground shadow"
                  style={{
                    left: `${marker.xPercent}%`,
                    top: `${marker.yPercent}%`,
                  }}
                  aria-label={`Marker ${index + 1}: ${marker.title}`}
                  onClick={() => setSelectedMarkerId(marker.id)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border p-4">
            <p className="font-medium">PDF floor plan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open the original PDF to inspect the floor plan. Interactive
              markers are listed beside it.
            </p>
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border border-border p-4">
          <h2 className="font-semibold">Before you go</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {floorPlan.publicNotes ??
              "Use the markers below to plan entrances, amenities, vertical access, and barriers before arrival."}
          </p>
        </section>

        {selectedMarker ? (
          <section className="rounded-lg border border-border p-4">
            <h2 className="font-semibold">{selectedMarker.title}</h2>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              {selectedMarker.type.replace(/_/g, " ")} ·{" "}
              {selectedMarker.confidence.replace(/_/g, " ")}
            </p>
            {selectedMarker.description ? (
              <p className="mt-2 text-sm">{selectedMarker.description}</p>
            ) : null}
            {selectedMarker.severity ? (
              <p className="mt-2 text-sm font-medium">
                Note: {selectedMarker.severity}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-lg border border-border p-4">
          <h2 className="font-semibold">Access markers</h2>
          {floorPlan.markers.length ? (
            <ol className="mt-2 space-y-2">
              {floorPlan.markers.map((marker, index) => (
                <li key={marker.id}>
                  <button
                    type="button"
                    className="w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => setSelectedMarkerId(marker.id)}
                  >
                    <span className="font-medium">
                      {index + 1}. {marker.title}
                    </span>
                    <span className="block capitalize text-muted-foreground">
                      {marker.type.replace(/_/g, " ")}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No markers have been published for this floor plan yet.
            </p>
          )}
        </section>

        <p className="text-xs text-muted-foreground">
          Floor plans are informational only and may change. Confirm critical
          access needs with the venue before travel.
        </p>
      </aside>
    </div>
  );
}

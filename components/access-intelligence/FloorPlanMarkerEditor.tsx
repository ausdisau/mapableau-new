"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type EditableMarker = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  xPercent: number;
  yPercent: number;
  confidence: string;
  severity?: string | null;
  sortOrder: number;
};

export function FloorPlanMarkerEditor({
  placeId,
  floorPlan,
}: {
  placeId: string;
  floorPlan: {
    id: string;
    title: string;
    status: string;
    assetUrl: string;
    mimeType: string;
    altText: string;
    markers: EditableMarker[];
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [draftPoint, setDraftPoint] = useState({ xPercent: 50, yPercent: 50 });
  const isImage = floorPlan.mimeType.startsWith("image/");

  async function postJson(path: string, body: unknown, method = "POST") {
    setError(null);
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setError(json?.error ?? "Update failed");
      return false;
    }
    router.refresh();
    return true;
  }

  async function addMarker(formData: FormData) {
    await postJson(
      `/api/access/places/${placeId}/floor-plans/${floorPlan.id}/markers`,
      {
        type: formData.get("type"),
        title: formData.get("title"),
        description: formData.get("description") || undefined,
        xPercent: draftPoint.xPercent,
        yPercent: draftPoint.yPercent,
        confidence: formData.get("confidence"),
        severity: formData.get("severity") || undefined,
        sortOrder: floorPlan.markers.length,
      },
    );
  }

  async function publish() {
    await fetch(
      `/api/access/places/${placeId}/floor-plans/${floorPlan.id}/publish`,
      { method: "POST" },
    );
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{floorPlan.title}</h2>
          <p className="text-sm text-muted-foreground">
            Status: {floorPlan.status}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 rounded-lg border border-border px-3 text-sm"
            onClick={() => void publish()}
          >
            Publish
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-border px-3 text-sm"
            onClick={() =>
              void postJson(
                `/api/access/places/${placeId}/floor-plans/${floorPlan.id}`,
                { status: "draft" },
                "PATCH",
              )
            }
          >
            Unpublish
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {isImage ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <button
            type="button"
            className="relative overflow-hidden rounded-lg border border-border bg-muted text-left"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setDraftPoint({
                xPercent:
                  Math.round(
                    ((event.clientX - rect.left) / rect.width) * 1000,
                  ) / 10,
                yPercent:
                  Math.round(
                    ((event.clientY - rect.top) / rect.height) * 1000,
                  ) / 10,
              });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={floorPlan.assetUrl}
              alt={floorPlan.altText}
              className="block h-auto w-full"
            />
            {floorPlan.markers.map((marker, index) => (
              <span
                key={marker.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground"
                style={{
                  left: `${marker.xPercent}%`,
                  top: `${marker.yPercent}%`,
                }}
              >
                {index + 1}
              </span>
            ))}
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background px-2 py-1 text-xs font-semibold"
              style={{
                left: `${draftPoint.xPercent}%`,
                top: `${draftPoint.yPercent}%`,
              }}
            >
              New
            </span>
          </button>

          <form action={addMarker} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Click the plan to position the next marker. Current point:{" "}
              {draftPoint.xPercent}%, {draftPoint.yPercent}%.
            </p>
            <MarkerFields />
            <button
              type="submit"
              className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
            >
              Add marker
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This PDF can be published as a reference document. Upload an image to
          place interactive markers.
        </p>
      )}

      <div>
        <h3 className="font-medium">Markers</h3>
        <ul className="mt-2 space-y-2">
          {floorPlan.markers.map((marker) => (
            <li
              key={marker.id}
              className="flex items-start justify-between gap-3 rounded-md border border-border p-3"
            >
              <div>
                <p className="font-medium">{marker.title}</p>
                <p className="text-sm capitalize text-muted-foreground">
                  {marker.type.replace(/_/g, " ")} · {marker.xPercent}%,{" "}
                  {marker.yPercent}%
                </p>
              </div>
              <button
                type="button"
                className="text-sm underline"
                onClick={() =>
                  void fetch(
                    `/api/access/places/${placeId}/floor-plans/${floorPlan.id}/markers/${marker.id}`,
                    { method: "DELETE" },
                  ).then(() => router.refresh())
                }
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MarkerFields() {
  return (
    <>
      <label className="block text-sm">
        Marker type
        <select
          name="type"
          className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
          defaultValue="entrance"
        >
          {[
            "entrance",
            "exit",
            "accessible_toilet",
            "lift",
            "stairs",
            "ramp",
            "accessible_parking",
            "reception",
            "service_counter",
            "seating",
            "sensory_quiet_area",
            "path_of_travel",
            "hazard",
            "other",
          ].map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Title
        <input
          name="title"
          required
          className="mt-1 min-h-11 w-full rounded-md border border-border px-3"
        />
      </label>
      <label className="block text-sm">
        Description
        <textarea
          name="description"
          className="mt-1 min-h-20 w-full rounded-md border border-border p-3"
        />
      </label>
      <label className="block text-sm">
        Confidence
        <select
          name="confidence"
          defaultValue="venue_provided"
          className="mt-1 min-h-11 w-full rounded-md border border-border bg-background px-3"
        >
          <option value="venue_provided">Venue provided</option>
          <option value="mapable_verified">MapAble verified</option>
          <option value="community_reported">Community reported</option>
        </select>
      </label>
      <label className="block text-sm">
        Severity / note
        <input
          name="severity"
          className="mt-1 min-h-11 w-full rounded-md border border-border px-3"
          placeholder="Optional: steep, narrow, noisy..."
        />
      </label>
    </>
  );
}

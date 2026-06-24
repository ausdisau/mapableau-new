"use client";

import { useState } from "react";

import { AccessIndoorViewer } from "@/components/access/AccessIndoorViewer";
import { AccessMap } from "@/components/access/AccessMap";
import type { IndoorPlaceView } from "@/lib/access-indoor/types";

export function AccessPlaceMapTabs({
  placeId,
  placeName,
  latitude,
  longitude,
  indoor,
}: {
  placeId: string;
  placeName: string;
  latitude: number;
  longitude: number;
  indoor: IndoorPlaceView | null;
}) {
  const hasIndoor = Boolean(
    indoor && indoor.buildings.some((b) => b.floors.length > 0)
  );
  const [tab, setTab] = useState<"outdoor" | "indoor">("outdoor");

  return (
    <section className="space-y-4" aria-label="Location and indoor maps">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Maps</h2>
        {hasIndoor ? (
          <div className="flex flex-wrap gap-2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "outdoor"}
              className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${
                tab === "outdoor"
                  ? "bg-[#005B7F] text-white"
                  : "border border-slate-200 bg-white"
              }`}
              onClick={() => setTab("outdoor")}
            >
              Outdoor
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "indoor"}
              className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${
                tab === "indoor"
                  ? "bg-[#005B7F] text-white"
                  : "border border-slate-200 bg-white"
              }`}
              onClick={() => setTab("indoor")}
            >
              Indoor
            </button>
          </div>
        ) : null}
      </div>

      {tab === "indoor" && hasIndoor && indoor ? (
        <AccessIndoorViewer placeId={placeId} indoor={indoor} />
      ) : (
        <AccessMap
          places={[
            {
              id: placeId,
              name: placeName,
              latitude,
              longitude,
            },
          ]}
        />
      )}
    </section>
  );
}

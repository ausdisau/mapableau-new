"use client";

import { useMemo, useState } from "react";

import { AccessBuilding3DMap } from "@/components/access/AccessBuilding3DMap";
import { AccessIndoorViewer } from "@/components/access/AccessIndoorViewer";
import { AccessMap } from "@/components/access/AccessMap";
import type { IndoorPlaceView } from "@/lib/access-indoor/types";
import { buildingSupports3D } from "@/lib/map/indoor/building-3d-layers";

type MapTab = "outdoor" | "indoor" | "building3d";

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
  const building = indoor?.buildings[0];
  const hasIndoor = Boolean(building && building.floors.length > 0);
  const has3D = Boolean(building && buildingSupports3D(building));
  const [tab, setTab] = useState<MapTab>("outdoor");

  const tabs = useMemo(() => {
    const items: { id: MapTab; label: string }[] = [{ id: "outdoor", label: "Outdoor" }];
    if (hasIndoor) items.push({ id: "indoor", label: "Indoor (2D)" });
    if (has3D) items.push({ id: "building3d", label: "3D Building" });
    return items;
  }, [hasIndoor, has3D]);

  return (
    <section className="space-y-4" aria-label="Location and indoor maps">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Maps</h2>
        {tabs.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="tablist">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${
                  tab === item.id
                    ? "bg-[#005B7F] text-white"
                    : "border border-slate-200 bg-white"
                }`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {tab === "building3d" && has3D && building ? (
        <AccessBuilding3DMap placeId={placeId} building={building} />
      ) : tab === "indoor" && hasIndoor && indoor ? (
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

"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import dynamic from "next/dynamic";

import type { IndoorBuildingView } from "@/lib/access-indoor/types";

const AccessBuilding3DMapLayer = dynamic(
  () =>
    import("@/components/access/AccessBuilding3DMapLayer").then(
      (m) => m.AccessBuilding3DMapLayer
    ),
  { ssr: false, loading: () => <p className="p-4 text-sm">Loading 3D map…</p> }
);

export function AccessBuilding3DMap({
  placeId,
  building,
}: {
  placeId: string;
  building: IndoorBuildingView;
}) {
  return <AccessBuilding3DMapLayer placeId={placeId} building={building} />;
}

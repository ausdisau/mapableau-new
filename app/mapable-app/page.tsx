import type { Metadata } from "next";

import { MapAbleApp } from "@/components/mapable-app/MapAbleApp";

export const metadata: Metadata = {
  title: "MapAble App Preview",
  description:
    "An interactive preview of MapAble's connected accessibility, care, transport and employment experience.",
};

export default function MapAbleAppPage() {
  return <MapAbleApp />;
}


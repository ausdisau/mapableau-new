"use client";

import React, { useState } from "react";

import { TourListView } from "@/components/tours/TourListView";
import { TourMap } from "@/components/tours/TourMap";
import type { Tour } from "@/lib/resources/tours-data";

type TourMapAndListProps = {
  tour: Tour;
};

export function TourMapAndList({ tour }: TourMapAndListProps) {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(
    tour.stops[0]?.id ?? null,
  );

  return (
    <div className="space-y-6">
      <TourListView
        tour={tour}
        selectedStopId={selectedStopId}
        onSelectStop={setSelectedStopId}
      />
      <TourMap
        tour={tour}
        selectedStopId={selectedStopId}
        onSelectStop={setSelectedStopId}
      />
    </div>
  );
}

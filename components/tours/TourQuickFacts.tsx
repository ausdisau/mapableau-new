import React from "react";

import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import {
  formatLoadLevel,
  formatTourDistance,
  formatTourDuration,
  type Tour,
} from "@/lib/resources/tours-data";

type TourQuickFactsProps = {
  tour: Tour;
};

export function TourQuickFacts({ tour }: TourQuickFactsProps) {
  const facts = [
    { label: "Duration", value: formatTourDuration(tour.durationMinutes) },
    { label: "Distance", value: formatTourDistance(tour.distanceMetres) },
    { label: "Sensory load", value: formatLoadLevel(tour.sensoryLoad) },
    { label: "Mobility load", value: formatLoadLevel(tour.mobilityLoad) },
    {
      label: "Transport complexity",
      value: formatLoadLevel(tour.transportComplexity),
    },
    { label: "Best time", value: tour.bestTimeOfDay },
  ];

  return (
    <section aria-labelledby="tour-quick-facts-heading">
      <h2
        id="tour-quick-facts-heading"
        className="text-lg font-black text-[#0C1833] sm:text-xl"
      >
        Quick facts
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className={mapablePublicCardClass}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
              {fact.label}
            </p>
            <p className="mt-2 text-sm font-semibold leading-7 text-[#0C1833]">
              {fact.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

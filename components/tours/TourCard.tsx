import Link from "next/link";
import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import {
  formatTourDistance,
  formatTourDuration,
  type Tour,
} from "@/lib/resources/tours-data";

type TourCardProps = {
  tour: Tour;
};

export function TourCard({ tour }: TourCardProps) {
  return (
    <Link
      href={`/resources/tours/${tour.slug}`}
      className={`${mapablePublicCardClass} block border-[#005B7F]/15 transition hover:border-[#005B7F]/40 hover:shadow-sm motion-reduce:transform-none ${mapableCareFocusRing}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
        {tour.city}, {tour.state}
      </p>
      <h3 className="mt-2 text-lg font-black text-[#0C1833]">{tour.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-700">{tour.summary}</p>
      <p className="mt-4 text-xs font-semibold text-slate-500">
        {formatTourDuration(tour.durationMinutes)} ·{" "}
        {formatTourDistance(tour.distanceMetres)} · Sensory{" "}
        {tour.sensoryLoad}
      </p>
      <p className="mt-4 text-sm font-bold text-[#005B7F]">
        Open tour
        <span aria-hidden="true"> →</span>
      </p>
    </Link>
  );
}

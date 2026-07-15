import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import {
  formatTourDistance,
  type Tour,
} from "@/lib/resources/tours-data";

type TourListViewProps = {
  tour: Tour;
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string) => void;
};

export function TourListView({
  tour,
  selectedStopId,
  onSelectStop,
}: TourListViewProps) {
  return (
    <section
      id="accessible-itinerary"
      aria-labelledby="accessible-itinerary-heading"
      className={mapablePublicCardClass}
    >
      <h2
        id="accessible-itinerary-heading"
        className="text-lg font-black text-[#0C1833] sm:text-xl"
      >
        Accessible list-view itinerary
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        Use this text itinerary if the map is unavailable, hard to use, or you
        prefer a plain list.
      </p>

      <h3 className="mt-5 text-sm font-black text-[#0C1833]">Route summary</h3>
      <p className="mt-2 text-sm leading-7 text-slate-700">{tour.routeSummary}</p>

      <ol className="mt-6 space-y-4">
        {tour.stops.map((stop) => {
          const selected = selectedStopId === stop.id;
          return (
            <li key={stop.id}>
              <button
                type="button"
                onClick={() => onSelectStop?.(stop.id)}
                aria-current={selected ? "step" : undefined}
                className={`w-full rounded-2xl border p-4 text-left transition motion-reduce:transform-none ${mapableCareFocusRing} ${
                  selected
                    ? "border-[#005B7F] bg-[#F6FBFC]"
                    : "border-slate-200 bg-white hover:border-[#005B7F]/30"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
                  Stop {stop.order}
                </p>
                <p className="mt-1 text-base font-black text-[#0C1833]">
                  {stop.name}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {stop.summary}
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  About {stop.estimatedMinutes} minutes ·{" "}
                  {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                </p>
              </button>
            </li>
          );
        })}
      </ol>

      {tour.segments.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-black text-[#0C1833]">Transfers</h3>
          <ul className="mt-3 space-y-3">
            {tour.segments.map((segment) => {
              const from = tour.stops.find((s) => s.id === segment.fromStopId);
              const to = tour.stops.find((s) => s.id === segment.toStopId);
              return (
                <li
                  key={segment.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700"
                >
                  <p className="font-black text-[#0C1833]">
                    {from?.name ?? segment.fromStopId} →{" "}
                    {to?.name ?? segment.toStopId}
                  </p>
                  <p className="mt-2">{segment.summary}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {segment.transportMode} ·{" "}
                    {formatTourDistance(segment.distanceMetres)}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {segment.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

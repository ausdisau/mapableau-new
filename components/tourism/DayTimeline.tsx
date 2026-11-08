"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import Link from "next/link";

import { EvidenceBadge } from "@/components/tourism/EvidenceBadge";
import { getTourismPlaceInTrip } from "@/lib/tourism/trip-ops";
import type { TourismTrip, TripDay, TripStop } from "@/lib/tourism/types";
import { tripStopId } from "@/lib/tourism/types";

function StopBody({
  trip,
  stop,
}: {
  trip: TourismTrip;
  stop: TripStop;
}) {
  switch (stop.kind) {
    case "attraction": {
      const place = getTourismPlaceInTrip(trip, stop.placeId);
      if (!place) return <p>Unknown place.</p>;
      return (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {place.neighbourhood} · attraction
          </p>
          <h3 className="mt-1 text-xl font-black">{place.name}</h3>
          <p className="mt-2 text-sm text-slate-600">{place.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <EvidenceBadge status={place.features.stepFree.status} />
            <EvidenceBadge status={place.features.toilets.status} />
          </div>
          <Link
            className="mt-2 inline-block text-sm font-bold text-[#005B7F] underline"
            href={`/tourism/places/${place.id}`}
          >
            View evidence and venue information
          </Link>
        </>
      );
    }
    case "rest":
      return (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Rest</p>
          <h3 className="mt-1 text-xl font-black">{stop.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{stop.note}</p>
        </>
      );
    case "transport":
      return (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Transport</p>
          <h3 className="mt-1 text-xl font-black">{stop.mode}</h3>
          <p className="mt-2 text-sm text-slate-600">{stop.note}</p>
          <div className="mt-3">
            <EvidenceBadge status={stop.evidenceStatus} />
          </div>
        </>
      );
    default: {
      const _exhaustive: never = stop;
      return _exhaustive;
    }
  }
}

export function DayTimeline({
  trip,
  day,
  onMoveEarlier,
  onMoveLater,
  onMoveDay,
  onRemove,
}: {
  trip: TourismTrip;
  day: TripDay;
  onMoveEarlier: (stopId: string) => void;
  onMoveLater: (stopId: string) => void;
  onMoveDay: (stopId: string, toDay: number) => void;
  onRemove: (stopId: string) => void;
}) {
  if (day.stops.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-400 bg-white p-7">
        This day is free. Add an attraction below.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {day.stops.map((stop, index) => {
        const id = tripStopId(stop);
        return (
          <li key={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d7f5ef] font-black text-[#005B7F]">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <StopBody trip={trip} stop={stop} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onMoveEarlier(id)}
                className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-sm font-semibold disabled:opacity-40"
              >
                <ArrowUp size={16} aria-hidden />
                Earlier
              </button>
              <button
                type="button"
                disabled={index === day.stops.length - 1}
                onClick={() => onMoveLater(id)}
                className="inline-flex min-h-11 items-center gap-1 rounded-lg border px-3 text-sm font-semibold disabled:opacity-40"
              >
                <ArrowDown size={16} aria-hidden />
                Later
              </button>
              <label className="text-sm font-semibold">
                Move to day{" "}
                <select
                  className="ml-1 min-h-11 rounded-lg border px-2"
                  value={day.day}
                  onChange={(event) => onMoveDay(id, Number(event.target.value))}
                >
                  {trip.days.map((item) => (
                    <option key={item.day} value={item.day}>
                      {item.day}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => onRemove(id)}
                className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-red-300 px-3 text-sm font-semibold text-red-800"
              >
                <Trash2 size={16} aria-hidden />
                Remove
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

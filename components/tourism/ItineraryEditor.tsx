"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { DayTimeline } from "@/components/tourism/DayTimeline";
import { SYDNEY_TOURISM_PLACES } from "@/lib/tourism/sydney-dataset";
import { addTourismStop, moveTourismStop, removeTourismStop } from "@/lib/tourism/trip-ops";
import { attractionIdsOnDay, type TourismTrip } from "@/lib/tourism/types";

export function ItineraryEditor({
  trip,
  selectedDay,
  onChange,
  onSelectDay,
}: {
  trip: TourismTrip;
  selectedDay: number;
  onChange: (trip: TourismTrip) => void;
  onSelectDay: (day: number) => void;
}) {
  const [selection, setSelection] = useState("");
  const day = trip.days.find((item) => item.day === selectedDay) ?? trip.days[0];
  const available = [...SYDNEY_TOURISM_PLACES, ...(trip.externalPlaces ?? [])].filter(
    (place) => !trip.days.some((item) => attractionIdsOnDay(item).includes(place.id)),
  );

  function move(stopId: string, targetIndex: number) {
    const index = day.stops.findIndex((stop) => stop.id === stopId);
    if (index < 0) return;
    onChange(moveTourismStop(trip, day.day, stopId, day.day, targetIndex));
  }

  return (
    <section aria-labelledby="itinerary-day" className="space-y-4">
      <h2 id="itinerary-day" className="text-2xl font-black">
        {day.title}
      </h2>
      <DayTimeline
        trip={trip}
        day={day}
        onMoveEarlier={(stopId) => {
          const index = day.stops.findIndex((stop) => stop.id === stopId);
          move(stopId, Math.max(0, index - 1));
        }}
        onMoveLater={(stopId) => {
          const index = day.stops.findIndex((stop) => stop.id === stopId);
          move(stopId, index + 1);
        }}
        onMoveDay={(stopId, toDay) => {
          onChange(moveTourismStop(trip, day.day, stopId, toDay));
          onSelectDay(toDay);
        }}
        onRemove={(stopId) => onChange(removeTourismStop(trip, stopId))}
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-black">Add an attraction</h3>
        <label htmlFor="add-tourism-stop" className="mt-3 block text-sm font-semibold">
          Choose an available place
        </label>
        <select
          id="add-tourism-stop"
          className="mt-1 min-h-11 w-full rounded-xl border px-3"
          value={selection}
          onChange={(event) => setSelection(event.target.value)}
        >
          <option value="">Choose a place…</option>
          {available.map((place) => (
            <option key={place.id} value={place.id}>
              {place.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selection}
          onClick={() => {
            if (!selection) return;
            onChange(addTourismStop(trip, selection, day.day));
            setSelection("");
          }}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#005B7F] px-5 font-bold text-white disabled:opacity-50"
        >
          <Plus size={18} aria-hidden />
          Add to day {day.day}
        </button>
      </div>
    </section>
  );
}

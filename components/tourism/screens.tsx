"use client";

import { CalendarDays, ExternalLink, MapPinned, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EvidencePanel } from "@/components/tourism/EvidencePanel";
import { ItineraryCard } from "@/components/tourism/ItineraryCard";
import { ItineraryEditor } from "@/components/tourism/ItineraryEditor";
import { OpenTripMapDiscovery } from "@/components/tourism/OpenTripMapDiscovery";
import { PlaceCard } from "@/components/tourism/PlaceCard";
import { PlannerForm } from "@/components/tourism/PlannerForm";
import { TourismHero } from "@/components/tourism/TourismHero";
import { TourismMap } from "@/components/tourism/TourismMap";
import { useDemoTrip } from "@/components/tourism/useDemoTrip";
import { makeSydneyDemoTrip } from "@/lib/tourism/planner";
import { SYDNEY_TOURISM_PLACES } from "@/lib/tourism/sydney-dataset";
import { getTourismPlaceInTrip, placesForDay } from "@/lib/tourism/trip-ops";
import { TOURISM_NEEDS, type TourismNeed } from "@/lib/tourism/types";

function eyebrow(text: string) {
  return <p className="text-xs font-black uppercase tracking-[0.2em] text-[#005B7F]">{text}</p>;
}

export function TourismDiscover() {
  const [query, setQuery] = useState("");
  const [needFilters, setNeedFilters] = useState<TourismNeed[]>(["step-free", "accessible-toilet"]);
  const visible = useMemo(
    () =>
      SYDNEY_TOURISM_PLACES.filter(
        (place) =>
          [place.name, place.neighbourhood, place.category]
            .join(" ")
            .toLowerCase()
            .includes(query.trim().toLowerCase()) &&
          (!needFilters.includes("step-free") || place.features.stepFree.status !== "unknown") &&
          (!needFilters.includes("accessible-toilet") || place.features.toilets.status !== "unknown"),
      ),
    [query, needFilters],
  );

  return (
    <>
      <TourismHero />
      <section className="mx-auto max-w-7xl space-y-8 px-5 py-12 lg:px-8" aria-labelledby="tourism-places">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            {eyebrow("Find your next experience")}
            <h2 id="tourism-places" className="mt-2 text-3xl font-black">
              Explore Sydney
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-600">
            Venue accessibility claims are attributed to sources, not independently audited by MapAble.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="tourism-search" className="block text-sm font-bold">
            Search places or neighbourhoods
          </label>
          <input
            id="tourism-search"
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-400 px-4 text-base focus-visible:outline-4 focus-visible:outline-[#005B7F]"
            placeholder="Try Opera House, museums or Darling Harbour"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <fieldset className="mt-4 flex flex-wrap gap-5">
            <legend className="mb-2 text-sm font-bold">Access preferences</legend>
            {TOURISM_NEEDS.filter((need) => need.id === "step-free" || need.id === "accessible-toilet").map(
              (need) => (
                <label key={need.id} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[#005B7F]"
                    checked={needFilters.includes(need.id)}
                    onChange={(event) =>
                      setNeedFilters((prev) =>
                        event.target.checked ? [...prev, need.id] : prev.filter((item) => item !== need.id),
                      )
                    }
                  />
                  {need.label}
                </label>
              ),
            )}
          </fieldset>
        </div>
        <p role="status" className="text-sm text-slate-600">
          {visible.length} illustrative Sydney places
        </p>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
        <ItineraryCard trip={makeSydneyDemoTrip()} />
        <section className="rounded-3xl bg-white p-6" aria-labelledby="evidence-explainer">
          <h2 id="evidence-explainer" className="text-2xl font-black">
            How evidence is labelled
          </h2>
          <p className="mt-3 max-w-3xl text-slate-600">
            Documented means a published operator or tourism page described the feature. Needs confirmation means the source is mixed or incomplete. Unknown means MapAble has no evidence. Independently verified is not used on this Sydney demo.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-[#005B7F]">
            <Link className="underline" href="/accessibility-map">
              MapAble Access map
            </Link>
            <Link className="underline" href="/resources">
              Resources
            </Link>
          </div>
        </section>
        <OpenTripMapDiscovery />
      </section>
    </>
  );
}

export function TourismPlanner() {
  const { trip, loaded } = useDemoTrip();
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      {eyebrow("Make the journey yours")}
      <h1 className="mt-2 text-4xl font-black">Plan your next adventure</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Create a sample itinerary without sharing your accessibility preferences with a third party. No bookings or route calculations are made.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <PlannerForm />
        <aside className="self-start rounded-3xl bg-[#073451] p-6 text-white">
          <CalendarDays size={34} aria-hidden />
          <h2 className="mt-4 text-2xl font-black">Sydney, your way</h2>
          <p className="mt-3 leading-relaxed text-white/90">
            Your outline uses curated harbour, culture and waterfront destinations, with rest and unverified transport buffers.
          </p>
          <p className="mt-5 text-sm text-white/85">
            {loaded ? `Current saved itinerary: ${trip.days.length} days.` : "Loading your saved example…"}
          </p>
        </aside>
      </div>
    </div>
  );
}

export function TourismItinerary() {
  const { trip, save, reset, loaded } = useDemoTrip();
  const [selectedDay, setSelectedDay] = useState(1);
  const day = trip.days.find((item) => item.day === selectedDay) ?? trip.days[0];
  return (
    <div className="mx-auto max-w-7xl space-y-7 px-5 py-12 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow("Saved in this browser only")}
          <h1 className="mt-2 text-4xl font-black">Your Sydney itinerary</h1>
          <p className="mt-3 text-slate-600">
            A flexible demo journey. Move stops, take breaks and confirm accessibility before travelling.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            setSelectedDay(1);
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-400 bg-white px-4 font-bold"
        >
          <RotateCcw size={17} aria-hidden />
          Reset trip
        </button>
      </div>
      <p className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-950" role="status" aria-live="polite">
        {loaded
          ? "Changes automatically save on this device. No travel services have been booked."
          : "Loading saved itinerary…"}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Select itinerary day">
        {trip.days.map((item) => (
          <button
            key={item.day}
            type="button"
            onClick={() => setSelectedDay(item.day)}
            aria-pressed={day.day === item.day}
            className={`min-h-11 rounded-xl border px-5 font-bold ${
              day.day === item.day
                ? "border-[#005B7F] bg-[#005B7F] text-white"
                : "border-slate-300 bg-white text-[#005B7F]"
            }`}
          >
            Day {item.day}
          </button>
        ))}
      </div>
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.83fr)]">
        <ItineraryEditor
          trip={trip}
          selectedDay={day.day}
          onChange={save}
          onSelectDay={setSelectedDay}
        />
        <aside className="space-y-4">
          <TourismMap places={placesForDay(trip, day)} dayFilterLabel={`Day ${day.day} attractions`} />
          <div className="rounded-2xl bg-[#073451] p-5 text-white">
            <h3 className="text-xl font-black">Travel checks</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              Check station lifts, accessible buses or ferries, kerb ramps and drop-off locations. Attraction accessibility does not validate the travel route.
            </p>
            <a
              href="https://transportnsw.info/trip"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-bold underline"
            >
              Transport for NSW Trip Planner
              <ExternalLink size={14} aria-hidden />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function TourismPlaceDetail({ id }: { id: string }) {
  const { trip, loaded } = useDemoTrip();
  const place = getTourismPlaceInTrip(trip, id);
  if (!place && !loaded) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16" role="status">
        Loading saved place details…
      </div>
    );
  }
  if (!place) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16">
        <h1 className="text-3xl font-black">Place not found</h1>
        <Link className="mt-4 inline-block underline" href="/tourism">
          Back to discovery
        </Link>
      </div>
    );
  }
  const photo = place.photos[0];
  return (
    <div className="mx-auto max-w-6xl space-y-7 px-5 py-12 lg:px-8">
      <Link className="text-sm font-bold text-[#005B7F] underline" href="/tourism">
        ← All Sydney places
      </Link>
      {eyebrow(`${place.neighbourhood} · ${place.category}`)}
      <h1 className="text-4xl font-black">{place.name}</h1>
      <p className="max-w-3xl text-lg text-slate-600">{place.description}</p>
      {photo ? (
        <div className="relative h-64 overflow-hidden rounded-3xl">
          <Image src={photo.src} alt={photo.alt} fill unoptimized className="object-cover" />
        </div>
      ) : null}
      <div className="grid gap-7 lg:grid-cols-2">
        <EvidencePanel place={place} />
        <div className="space-y-5">
          <TourismMap places={[place]} />
          <div className="rounded-2xl bg-white p-5">
            <MapPinned size={22} aria-hidden />
            <h2 className="mt-2 font-black">Plan the whole journey</h2>
            <p className="mt-2 text-sm text-slate-600">{place.address}</p>
            <p className="mt-2 text-sm text-slate-600">
              Check the exact approach, pedestrian crossings and any lift outages before departure.
            </p>
            <Link
              href="/tourism/trips/sydney-demo"
              className="mt-4 inline-block rounded-xl bg-[#005B7F] px-5 py-3 font-bold text-white"
            >
              Add context in the Sydney itinerary
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TourismMapPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-12 lg:px-8">
      {eyebrow("See the city differently")}
      <h1 className="text-4xl font-black">Explore Sydney on the map</h1>
      <p className="max-w-3xl text-slate-600">
        Select a marker or use the place list. The map locates venues but does not calculate or guarantee step-free routes.
      </p>
      <TourismMap places={SYDNEY_TOURISM_PLACES} />
    </div>
  );
}

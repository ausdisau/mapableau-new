"use client";

import maplibregl from "maplibre-gl";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import { LazyMapPanel, type DirectoryViewMode } from "@/components/map/LazyMapPanel";
import { EvidenceBadge } from "@/components/tourism/EvidenceBadge";
import { getMapAttribution, getMapStyleUrl } from "@/lib/map/map-style";
import type { TourismPlace } from "@/lib/tourism/types";

function PlaceList({
  places,
  selected,
  onSelect,
}: {
  places: TourismPlace[];
  selected: string;
  onSelect: (place: TourismPlace) => void;
}) {
  if (places.length === 0) {
    return <p className="p-4 text-sm">No places yet. Add a stop to this day.</p>;
  }
  return (
    <ul className="space-y-2 p-4">
      {places.map((place) => (
        <li
          key={place.id}
          className={`flex items-center gap-3 rounded-xl border p-3 ${
            selected === place.id ? "border-[#005B7F] bg-sky-50" : "border-slate-200"
          }`}
        >
          <button
            type="button"
            aria-pressed={selected === place.id}
            onClick={() => onSelect(place)}
            className="min-h-11 flex-1 text-left text-sm font-bold text-[#005B7F] underline"
          >
            {place.name}
            <span className="block text-xs font-normal text-slate-600">{place.neighbourhood}</span>
            <span className="mt-1 flex flex-wrap gap-1">
              <EvidenceBadge status={place.features.stepFree.status} />
            </span>
          </button>
          <Link
            href={`/tourism/places/${place.id}`}
            className="rounded-lg border border-[#005B7F] px-3 py-3 text-xs font-bold text-[#005B7F]"
          >
            Details
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MapCanvas({
  places,
  selected,
}: {
  places: TourismPlace[];
  selected: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const ids = places.map((place) => place.id).join("|");

  useEffect(() => {
    if (!container.current) return;
    let instance: maplibregl.Map | null = null;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        style: getMapStyleUrl(),
        center: [151.207, -33.866],
        zoom: 12,
        attributionControl: false,
      });
      instance.addControl(new maplibregl.NavigationControl(), "top-right");
      instance.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
      map.current = instance;
      const markers = places.map((place) => {
        const dot = document.createElement("span");
        const highlight = selected === place.id;
        dot.className = `block h-5 w-5 rounded-full border-[3px] border-white shadow-lg ${
          highlight ? "bg-[#F8C51C]" : "bg-[#005B7F]"
        }`;
        dot.setAttribute("aria-hidden", "true");
        const popup = new maplibregl.Popup({ offset: 18 }).setHTML(
          `<p><strong>${place.name}</strong></p><p>${place.features.stepFree.summary}</p><p>Not a verified accessible route.</p>`,
        );
        return new maplibregl.Marker({ element: dot })
          .setLngLat([place.longitude, place.latitude])
          .setPopup(popup)
          .addTo(instance!);
      });
      if (places.length === 1) {
        instance.setCenter([places[0].longitude, places[0].latitude]);
        instance.setZoom(14);
      }
      if (places.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        places.forEach((place) => bounds.extend([place.longitude, place.latitude]));
        instance.fitBounds(bounds, { padding: 65, maxZoom: 13, duration: 0 });
      }
      const selectedPlace = places.find((place) => place.id === selected);
      if (selectedPlace) {
        instance.flyTo({ center: [selectedPlace.longitude, selectedPlace.latitude], zoom: 14 });
      }
      return () => {
        markers.forEach((marker) => marker.remove());
        map.current = null;
        instance?.remove();
      };
    } catch {
      instance?.remove();
    }
    return undefined;
  }, [ids, selected, places]);

  return (
    <div
      ref={container}
      className="h-[320px] w-full bg-[#deedf0]"
      role="img"
      aria-label="Illustrative map of Sydney locations; all places are listed as well."
    />
  );
}

export function TourismMap({
  places,
  dayFilterLabel,
}: {
  places: TourismPlace[];
  dayFilterLabel?: string;
}) {
  const [selected, setSelected] = useState("");
  const [view, setView] = useState<DirectoryViewMode>("list");
  const uniquePlaces = useMemo(() => {
    const seen = new Set<string>();
    return places.filter((place) => {
      if (seen.has(place.id)) return false;
      seen.add(place.id);
      return true;
    });
  }, [places]);

  return (
    <section
      aria-label="Tourism place map and accessible results"
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
        <h2 className="text-xl font-black">Places in this view</h2>
        {dayFilterLabel ? <p className="text-sm text-slate-600">{dayFilterLabel}</p> : null}
      </div>
      <LazyMapPanel
        view={view}
        onViewChange={setView}
        listLabel="List of tourism places"
        mapLabel="Map of tourism places"
        statusMessage="The keyboard list is the operable path. The map locates venues and does not calculate step-free routes."
        list={
          <PlaceList
            places={uniquePlaces}
            selected={selected}
            onSelect={(place) => setSelected(place.id)}
          />
        }
        map={
          <MapCanvas
            places={uniquePlaces}
            selected={selected}
          />
        }
      />
      <p className="px-5 py-3 text-xs text-slate-600">
        {getMapAttribution()} · Pins are indicative; routes have not been checked for step-free access.
      </p>
    </section>
  );
}

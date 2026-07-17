"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import React, { useEffect, useMemo, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Source } from "react-map-gl/maplibre";

import { useMapConfig } from "@/components/map/MapProvider";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import type { Tour } from "@/lib/resources/tours-data";

type TourMapProps = {
  tour: Tour;
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string) => void;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function TourMap({
  tour,
  selectedStopId,
  onSelectStop,
}: TourMapProps) {
  const { styleUrl, defaultCenter } = useMapConfig();
  const reducedMotion = usePrefersReducedMotion();
  const [mapFailed, setMapFailed] = useState(false);

  const lineGeoJson = useMemo(() => {
    const lineFeature = tour.geojson.features.find(
      (feature) => feature.geometry.type === "LineString",
    );
    if (!lineFeature) {
      return {
        type: "FeatureCollection" as const,
        features: [],
      };
    }
    return {
      type: "FeatureCollection" as const,
      features: [lineFeature],
    };
  }, [tour.geojson]);

  const center = useMemo(() => {
    if (!tour.stops.length) {
      return {
        latitude: defaultCenter.lat,
        longitude: defaultCenter.lng,
        zoom: defaultCenter.zoom,
      };
    }
    const latitude =
      tour.stops.reduce((sum, stop) => sum + stop.latitude, 0) /
      tour.stops.length;
    const longitude =
      tour.stops.reduce((sum, stop) => sum + stop.longitude, 0) /
      tour.stops.length;
    return {
      latitude,
      longitude,
      zoom: tour.stops.length === 1 ? 14 : 11.5,
    };
  }, [tour.stops, defaultCenter.lat, defaultCenter.lng, defaultCenter.zoom]);

  if (mapFailed) {
    return (
      <section
        id="tour-map"
        aria-labelledby="tour-map-heading"
        className={mapablePublicCardClass}
      >
        <h2
          id="tour-map-heading"
          className="text-lg font-black text-[#0C1833] sm:text-xl"
        >
          Interactive map
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          The map could not load right now. Use the accessible list-view
          itinerary below for the full route, stops and transfer notes.
        </p>
      </section>
    );
  }

  return (
    <section
      id="tour-map"
      aria-labelledby="tour-map-heading"
      className={mapablePublicCardClass}
    >
      <h2
        id="tour-map-heading"
        className="text-lg font-black text-[#0C1833] sm:text-xl"
      >
        Interactive map
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        Map pins mirror the list itinerary. The map is optional — every stop
        and transfer is also written out as text.
      </p>
      <div className="mt-4 h-[22rem] overflow-hidden rounded-2xl border border-slate-200 sm:h-[28rem]">
        <Map
          initialViewState={center}
          mapStyle={styleUrl}
          style={{ width: "100%", height: "100%" }}
          attributionControl={{}}
          onError={() => setMapFailed(true)}
          reuseMaps
        >
          <NavigationControl
            position="top-left"
            visualizePitch={!reducedMotion}
          />
          {lineGeoJson.features.length > 0 ? (
            <Source id="tour-route" type="geojson" data={lineGeoJson}>
              <Layer
                id="tour-route-line"
                type="line"
                paint={{
                  "line-color": "#005B7F",
                  "line-width": 3,
                  "line-opacity": 0.75,
                }}
              />
            </Source>
          ) : null}
          {tour.stops.map((stop) => {
            const selected = selectedStopId === stop.id;
            return (
              <Marker
                key={stop.id}
                latitude={stop.latitude}
                longitude={stop.longitude}
                anchor="bottom"
                onClick={(event) => {
                  event.originalEvent.stopPropagation();
                  onSelectStop?.(stop.id);
                }}
              >
                <button
                  type="button"
                  aria-label={`${stop.name}${selected ? ", selected" : ""}`}
                  aria-pressed={selected}
                  className={`rounded-xl px-2 py-1 text-xs font-black shadow ${mapableCareFocusRing} ${
                    selected
                      ? "bg-[#005B7F] text-white"
                      : "bg-white text-[#0C1833]"
                  }`}
                >
                  {stop.order}. {stop.name}
                </button>
              </Marker>
            );
          })}
        </Map>
      </div>
    </section>
  );
}

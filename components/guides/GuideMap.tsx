"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import React, { useEffect, useMemo, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";

import { GuideMarkerPopup } from "@/components/guides/GuideMarkerPopup";
import { useMapConfig } from "@/components/map/MapProvider";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import {
  getAccessGuideMarkerKind,
  type AccessGuide,
} from "@/lib/resources/access-guides-data";

type GuideMapProps = {
  guides: AccessGuide[];
  selectedGuideId: string | null;
  onSelectGuide: (guideId: string) => void;
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

function markerClasses(guide: AccessGuide, selected: boolean): string {
  const kind = getAccessGuideMarkerKind(guide);
  const base =
    "inline-flex min-h-11 min-w-11 flex-col items-center justify-center rounded-xl border-2 px-2 py-1 text-[0.65rem] font-black shadow motion-reduce:transform-none";
  const selectedRing = selected ? "ring-4 ring-[#F8C51C]/50" : "";
  const outline = kind.needsVerification ? "border-dashed" : "border-solid";

  switch (kind.kind) {
    case "capital":
      return `${base} ${outline} ${selectedRing} border-[#0C1833] bg-[#F8C51C] text-[#0C1833]`;
    case "tier1":
      return `${base} ${outline} ${selectedRing} border-[#0C1833] bg-[#00A979] text-white`;
    case "tier2":
      return `${base} ${outline} ${selectedRing} border-[#0C1833] bg-[#005B7F] text-white`;
    case "tier3":
      return `${base} ${outline} ${selectedRing} border-[#0C1833] bg-slate-200 text-[#0C1833]`;
    default: {
      const _exhaustive: never = kind.kind;
      return _exhaustive;
    }
  }
}

export function GuideMap({
  guides,
  selectedGuideId,
  onSelectGuide,
}: GuideMapProps) {
  const { styleUrl, attribution, defaultCenter } = useMapConfig();
  const reducedMotion = usePrefersReducedMotion();
  const [mapFailed, setMapFailed] = useState(false);
  const [mapActive, setMapActive] = useState(false);
  const selectedGuide =
    guides.find((guide) => guide.id === selectedGuideId) ?? null;

  const center = useMemo(() => {
    if (!guides.length) {
      return {
        latitude: defaultCenter.lat,
        longitude: defaultCenter.lng,
        zoom: 4,
      };
    }
    const latitude =
      guides.reduce((sum, guide) => sum + guide.latitude, 0) / guides.length;
    const longitude =
      guides.reduce((sum, guide) => sum + guide.longitude, 0) / guides.length;
    return {
      latitude,
      longitude,
      zoom: guides.length > 20 ? 4.2 : guides.length > 5 ? 5.2 : 6.5,
    };
  }, [guides, defaultCenter.lat, defaultCenter.lng]);

  if (mapFailed) {
    return (
      <section
        id="guides-map"
        aria-labelledby="guides-map-heading"
        className={mapablePublicCardClass}
      >
        <h3
          id="guides-map-heading"
          className="text-lg font-black text-[#0C1833]"
        >
          Interactive guide map
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          The map could not load right now. Use the guide list below — every
          guide link stays available without the map.
        </p>
      </section>
    );
  }

  return (
    <section
      id="guides-map"
      aria-labelledby="guides-map-heading"
      className={mapablePublicCardClass}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            id="guides-map-heading"
            className="text-lg font-black text-[#0C1833]"
          >
            Interactive guide map
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-700">
            Markers show city and town guide centres. Labels use C / T1 / T2 /
            T3 so colour is not the only cue. Dashed borders mean the guide
            still needs local verification.
          </p>
        </div>
        <button
          type="button"
          aria-pressed={mapActive}
          onClick={() => setMapActive((value) => !value)}
          className={`inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-sm font-bold ${mapableCareFocusRing} ${
            mapActive
              ? "border-[#005B7F] bg-[#005B7F] text-white"
              : "border-slate-200 bg-white text-[#005B7F]"
          }`}
        >
          {mapActive ? "Map active (scroll zoom on)" : "Use map"}
        </button>
      </div>

      <div className="relative mt-4 h-[24rem] overflow-hidden rounded-2xl border border-slate-200 sm:h-[32rem]">
        {!mapActive ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4">
            <p className="rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow">
              Scroll zoom is off until you activate the map
            </p>
          </div>
        ) : null}
        <Map
          initialViewState={center}
          mapStyle={styleUrl}
          style={{ width: "100%", height: "100%" }}
          attributionControl={{}}
          scrollZoom={mapActive}
          dragPan={mapActive || undefined}
          onError={() => setMapFailed(true)}
          reuseMaps
        >
          <NavigationControl
            position="top-left"
            visualizePitch={!reducedMotion}
          />
          {guides.map((guide) => {
            const selected = selectedGuideId === guide.id;
            const kind = getAccessGuideMarkerKind(guide);
            return (
              <Marker
                key={guide.id}
                latitude={guide.latitude}
                longitude={guide.longitude}
                anchor="bottom"
                onClick={(event) => {
                  event.originalEvent.stopPropagation();
                  onSelectGuide(guide.id);
                }}
              >
                <button
                  type="button"
                  aria-label={`Open ${guide.city} Access Guide`}
                  aria-pressed={selected}
                  className={`${markerClasses(guide, selected)} ${mapableCareFocusRing}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectGuide(guide.id);
                  }}
                >
                  <span aria-hidden="true">{kind.label}</span>
                  <span className="max-w-[4.5rem] truncate text-[0.55rem] font-bold leading-tight">
                    {guide.city}
                  </span>
                  {kind.needsVerification ? (
                    <span className="text-[0.5rem] font-bold uppercase tracking-wide">
                      Verify
                    </span>
                  ) : null}
                </button>
              </Marker>
            );
          })}
        </Map>
      </div>

      <p className="mt-3 text-xs leading-6 text-slate-500">{attribution}</p>

      {selectedGuide ? (
        <div className="mt-4">
          <GuideMarkerPopup
            guide={selectedGuide}
            onClose={() => onSelectGuide("")}
          />
        </div>
      ) : (
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Select a marker to preview the guide, then open it or report an access
          update.
        </p>
      )}
    </section>
  );
}

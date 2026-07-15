"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";

import { useMapConfig } from "@/components/map/MapProvider";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import { suburbGuideSectionHref } from "@/lib/resources/suburb-access-guides-data";
import type {
  SuburbAccessGuide,
  SuburbGuideMapSection,
} from "@/types/suburb-access-guide";

type SuburbGuideMapProps = {
  guide: SuburbAccessGuide;
};

const SECTION_MARKERS: Array<{
  section: SuburbGuideMapSection;
  label: string;
  offset: [number, number];
}> = [
  { section: "toilets", label: "Toilets", offset: [0.004, 0.002] },
  { section: "transport", label: "Transport", offset: [-0.003, 0.003] },
  { section: "parking", label: "Parking", offset: [0.003, -0.003] },
  { section: "quiet-spaces", label: "Quiet spaces", offset: [-0.004, -0.002] },
  {
    section: "accessible-venues",
    label: "Venues",
    offset: [0.002, 0.005],
  },
  { section: "hazards", label: "Hazards", offset: [-0.005, 0.001] },
];

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

export function SuburbGuideMap({ guide }: SuburbGuideMapProps) {
  const { styleUrl, attribution } = useMapConfig();
  const reducedMotion = usePrefersReducedMotion();
  const [mapFailed, setMapFailed] = useState(false);
  const [mapActive, setMapActive] = useState(false);

  const markers = useMemo(
    () =>
      SECTION_MARKERS.map((marker) => ({
        ...marker,
        latitude: guide.centroid.latitude + marker.offset[0],
        longitude: guide.centroid.longitude + marker.offset[1],
        href: suburbGuideSectionHref(guide, marker.section),
      })),
    [guide],
  );

  if (mapFailed) {
    return (
      <section
        id="suburb-guide-map"
        aria-labelledby="suburb-guide-map-heading"
        className={mapablePublicCardClass}
      >
        <h2
          id="suburb-guide-map-heading"
          className="text-lg font-black text-[#0C1833]"
        >
          Locality map
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          The map could not load. Use the skip link and section list below —
          every access theme remains available without the map.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
          {markers.map((marker) => (
            <li key={marker.section}>
              <Link
                href={marker.href}
                className={`font-medium text-primary underline-offset-2 hover:underline ${mapableCareFocusRing}`}
              >
                {marker.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      id="suburb-guide-map"
      aria-labelledby="suburb-guide-map-heading"
      className={mapablePublicCardClass}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="suburb-guide-map-heading"
            className="text-lg font-black text-[#0C1833]"
          >
            Locality map
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-700">
            Markers jump to guide sections for toilets, transport, parking,
            quiet spaces, accessible venues and hazards. Map positions are
            approximate locality cues, not surveyed access points.
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
          {mapActive ? "Map active" : "Use map"}
        </button>
      </div>

      <div className="mt-4 h-[22rem] overflow-hidden rounded-2xl border border-slate-200 sm:h-[28rem]">
        <Map
          initialViewState={{
            latitude: guide.centroid.latitude,
            longitude: guide.centroid.longitude,
            zoom: 13,
          }}
          mapStyle={styleUrl}
          style={{ width: "100%", height: "100%" }}
          attributionControl={{}}
          scrollZoom={mapActive}
          onError={() => setMapFailed(true)}
          reuseMaps
        >
          <NavigationControl
            position="top-left"
            visualizePitch={!reducedMotion}
          />
          <Marker
            latitude={guide.centroid.latitude}
            longitude={guide.centroid.longitude}
            anchor="bottom"
          >
            <span className="inline-flex min-h-11 items-center rounded-xl bg-[#F8C51C] px-3 text-xs font-black text-[#0C1833] shadow">
              {guide.name} centre
            </span>
          </Marker>
          {markers.map((marker) => (
            <Marker
              key={marker.section}
              latitude={marker.latitude}
              longitude={marker.longitude}
              anchor="bottom"
            >
              <Link
                href={marker.href}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-[#0C1833] bg-white px-2 text-[0.65rem] font-black text-[#0C1833] shadow ${mapableCareFocusRing}`}
                aria-label={`Jump to ${marker.label} section`}
              >
                {marker.label}
              </Link>
            </Marker>
          ))}
        </Map>
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-500">{attribution}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {markers.map((marker) => (
          <li key={`${marker.section}-list`}>
            <Link
              href={marker.href}
              className={`inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#005B7F] ${mapableCareFocusRing}`}
            >
              {marker.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";

import { useMapConfig } from "@/components/map/MapProvider";
import { formatSuburbGuideStatus } from "@/lib/guides/suburb-guide-utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import type { SuburbAccessGuide } from "@/types/suburb-access-guide";

type SuburbGuidesIndexMapProps = {
  guides: SuburbAccessGuide[];
  /** Heading level styling only; keep a single h1 on the page. */
  title?: string;
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

/**
 * Map-first overview of suburb guides. Markers link to guide pages.
 * An HTML list of the same guides must remain available on the page.
 */
export function SuburbGuidesIndexMap({
  guides,
  title = "Suburb guides map",
}: SuburbGuidesIndexMapProps) {
  const { styleUrl, attribution, defaultCenter } = useMapConfig();
  const reducedMotion = usePrefersReducedMotion();
  const [mapFailed, setMapFailed] = useState(false);
  const [mapActive, setMapActive] = useState(false);

  const center = useMemo(() => {
    if (!guides.length) {
      return {
        latitude: defaultCenter.lat,
        longitude: defaultCenter.lng,
        zoom: 4,
      };
    }
    const latitude =
      guides.reduce((sum, guide) => sum + guide.centroid.latitude, 0) /
      guides.length;
    const longitude =
      guides.reduce((sum, guide) => sum + guide.centroid.longitude, 0) /
      guides.length;
    const zoom = guides.length === 1 ? 12 : guides.length < 5 ? 5.5 : 4.2;
    return { latitude, longitude, zoom };
  }, [defaultCenter.lat, defaultCenter.lng, guides]);

  if (mapFailed) {
    return (
      <section
        id="suburb-guides-map"
        aria-labelledby="suburb-guides-map-heading"
        className={mapablePublicCardClass}
      >
        <h2
          id="suburb-guides-map-heading"
          className="text-lg font-black text-[#0C1833]"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          The map could not load. Use the suburb guide list below — every
          guide remains available without the map.
        </p>
      </section>
    );
  }

  return (
    <section
      id="suburb-guides-map"
      aria-labelledby="suburb-guides-map-heading"
      className={mapablePublicCardClass}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="suburb-guides-map-heading"
            className="text-lg font-black text-[#0C1833]"
          >
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-700">
            Select a marker to open that suburb Access Guide. All markers are
            also listed as ordinary links outside the map.
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
          initialViewState={center}
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
          {guides.map((guide) => (
            <Marker
              key={guide.id}
              latitude={guide.centroid.latitude}
              longitude={guide.centroid.longitude}
              anchor="bottom"
            >
              <Link
                href={guide.href}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-[#0C1833] bg-[#00A979] px-2 text-[0.65rem] font-black text-white shadow ${mapableCareFocusRing}`}
                aria-label={`${guide.name} Access Guide, ${formatSuburbGuideStatus(guide.guideStatus)}`}
              >
                {guide.name}
              </Link>
            </Marker>
          ))}
        </Map>
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-500">{attribution}</p>
    </section>
  );
}

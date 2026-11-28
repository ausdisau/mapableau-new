"use client";

import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState } from "react";

import type { CommunityInfrastructureFeature } from "@/lib/access/community-infrastructure/types";

import styles from "./CommunityInfrastructure.module.css";
import {
  COMMUNITY_CATEGORY_LABELS,
  communityTileAttribution,
} from "./presentation";

const markerStyle = {
  parking: { letter: "P", color: "#005B7F" },
  toilet: { letter: "T", color: "#6D28D9" },
  public_space: { letter: "S", color: "#166534" },
};

export default function CommunityInfrastructureMap({
  features,
  onSelect,
}: {
  features: CommunityInfrastructureFeature[];
  onSelect: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let instance: LeafletMap | null = null;
    setMapError(null);

    void import("leaflet")
      .then((L) => {
        if (cancelled || !container.current) return;
        instance = L.map(container.current, {
          keyboard: true,
          scrollWheelZoom: false,
          zoomAnimation: false,
          fadeAnimation: false,
          markerZoomAnimation: false,
        });
        instance
          .getContainer()
          .setAttribute(
            "aria-label",
            "Community infrastructure map. Use arrow keys to pan and plus or minus to zoom.",
          );
        L.tileLayer(
          process.env.NEXT_PUBLIC_OSM_TILE_URL ??
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution: communityTileAttribution(
              process.env.NEXT_PUBLIC_MAP_ATTRIBUTION,
            ),
          },
        )
          .on("tileerror", () => {
            if (!cancelled)
              setMapError(
                "Map tiles are unavailable. All source records remain available in the list below.",
              );
          })
          .addTo(instance);

        const bounds = L.latLngBounds([]);
        features.forEach((feature, index) => {
          const [longitude, latitude] = feature.geometry.coordinates;
          if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return;
          const style = markerStyle[feature.properties.category];
          const symbol = document.createElement("span");
          symbol.textContent = style.letter;
          symbol.className = styles.markerSymbol;
          symbol.style.backgroundColor = style.color;
          symbol.setAttribute("aria-hidden", "true");
          const label = `${index + 1}. ${feature.properties.name}. ${COMMUNITY_CATEGORY_LABELS[feature.properties.category]}. Read access details.`;
          const marker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              html: symbol,
              className: styles.marker,
              iconSize: [44, 44],
              iconAnchor: [22, 22],
            }),
            title: label,
            alt: label,
            keyboard: true,
            riseOnHover: true,
          });
          // Before fitBounds, Leaflet may defer creating the marker element.
          marker.on("add", () => {
            marker.getElement()?.setAttribute("aria-label", label);
          });
          marker.on("click", () => onSelect(feature.id));
          marker.on("keydown", ({ originalEvent }) => {
            if (originalEvent.key !== "Enter" && originalEvent.key !== " ")
              return;
            // A divIcon has button semantics but no native keyboard activation.
            // Consume the key once here, including Space's page-scroll default.
            L.DomEvent.stop(originalEvent);
            if (!originalEvent.repeat) onSelect(feature.id);
          });
          marker.addTo(instance!);
          bounds.extend([latitude, longitude]);
        });

        if (bounds.isValid())
          instance.fitBounds(bounds, {
            padding: [32, 32],
            maxZoom: 15,
            animate: false,
          });
        else instance.setView([-33.815, 151.005], 13);
      })
      .catch(() => {
        if (!cancelled)
          setMapError(
            "The map could not load. All source records remain available in the list below.",
          );
      });

    return () => {
      cancelled = true;
      instance?.remove();
    };
  }, [features, onSelect]);

  return (
    <section aria-label="Optional map of the listed source records">
      {mapError ? (
        <p
          role="status"
          className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          {mapError}
        </p>
      ) : null}
      <div ref={container} className={styles.map} />
      <ul
        aria-label="Map symbols"
        className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700"
      >
        <li>
          <strong>P</strong> — Parking
        </li>
        <li>
          <strong>T</strong> — Toilets
        </li>
        <li>
          <strong>S</strong> — Public spaces
        </li>
      </ul>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Select a marker to focus its access details below. Markers locate source
        records; they are not route instructions. Map tiles load from the
        configured tile provider when this view opens.
      </p>
    </section>
  );
}

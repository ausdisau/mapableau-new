"use client";

import L from "leaflet";
import { useMemo } from "react";
import { Marker } from "react-leaflet";

import type { DemoAccessTier } from "@/lib/demo/accessibility-places";
import {
  categoryAccessibleLabel,
  categoryIconLetter,
  tierAbbreviation,
  tierAccessibleLabel,
  tierMarkerClass,
  type CoordinatePlace,
  getPlaceCoordinates,
} from "@/lib/map/accessibilityMapUtils";

export type AccessibilityMapMarkerPlace = CoordinatePlace & {
  id: string;
  name: string;
  category: string;
  tier: DemoAccessTier | string;
};

type AccessibilityMapMarkerProps = {
  place: AccessibilityMapMarkerPlace;
  isSelected: boolean;
  onSelect: (id: string) => void;
  children?: React.ReactNode;
};

function createAccessibilityMarkerIcon(
  place: AccessibilityMapMarkerPlace,
  isSelected: boolean,
): L.DivIcon {
  const tierAbbr = tierAbbreviation(place.tier);
  const catLetter = categoryIconLetter(place.category);
  const tierClass = tierMarkerClass(place.tier);
  const selectedClass = isSelected ? "access-map-marker--selected" : "";

  return L.divIcon({
    className: "",
    html: `<div
      class="access-map-marker ${tierClass} ${selectedClass}"
      aria-hidden="true"
    >
      <span class="access-map-marker__icon">♿</span>
      <span class="access-map-marker__tier">${tierAbbr}</span>
      <span class="access-map-marker__category">${catLetter}</span>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });
}

export function markerAccessibleName(place: AccessibilityMapMarkerPlace): string {
  const category = categoryAccessibleLabel(place.category);
  const tier = tierAccessibleLabel(String(place.tier));
  return `${place.name}, ${category}, ${tier}`;
}

export function AccessibilityMapMarker({
  place,
  isSelected,
  onSelect,
  children,
}: AccessibilityMapMarkerProps) {
  const coords = getPlaceCoordinates(place);
  const icon = useMemo(
    () => createAccessibilityMarkerIcon(place, isSelected),
    [place.id, place.tier, place.category, isSelected],
  );

  if (!coords) return null;

  return (
    <Marker
      position={coords}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(place.id),
        keypress: (event) => {
          if (event.originalEvent.key === "Enter" || event.originalEvent.key === " ") {
            event.originalEvent.preventDefault();
            onSelect(place.id);
          }
        },
      }}
      // eslint-disable-next-line jsx-a11y/aria-props -- Leaflet manages marker button semantics
      aria-label={markerAccessibleName(place)}
    >
      {children}
    </Marker>
  );
}

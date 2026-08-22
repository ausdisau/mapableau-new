/** Distinct marker colours/symbols for GAIS map layer categories. */

import type { GaisFeatureType } from "@/lib/gais/contracts/feature-types";

export type GaisMarkerStyle = {
  backgroundColor: string;
  borderColor: string;
  shape: "circle" | "diamond" | "square" | "triangle";
  label: string;
};

export const GAIS_MARKER_STYLES: Record<GaisFeatureType, GaisMarkerStyle> = {
  PLACE: {
    backgroundColor: "#005B7F",
    borderColor: "#003D56",
    shape: "circle",
    label: "Place",
  },
  ENTRANCE: {
    backgroundColor: "#00A979",
    borderColor: "#007A58",
    shape: "square",
    label: "Entrance",
  },
  LIFT: {
    backgroundColor: "#6366F1",
    borderColor: "#4338CA",
    shape: "square",
    label: "Lift",
  },
  RAMP: {
    backgroundColor: "#0891B2",
    borderColor: "#0E7490",
    shape: "diamond",
    label: "Ramp",
  },
  CROSSING: {
    backgroundColor: "#CA8A04",
    borderColor: "#A16207",
    shape: "diamond",
    label: "Crossing",
  },
  REST_POINT: {
    backgroundColor: "#64748B",
    borderColor: "#475569",
    shape: "circle",
    label: "Rest point",
  },
  TEMPORARY_BARRIER: {
    backgroundColor: "#DC2626",
    borderColor: "#991B1B",
    shape: "triangle",
    label: "Temporary condition",
  },
  PATH: {
    backgroundColor: "#94A3B8",
    borderColor: "#64748B",
    shape: "circle",
    label: "Path",
  },
  DOOR: {
    backgroundColor: "#0D9488",
    borderColor: "#0F766E",
    shape: "square",
    label: "Door",
  },
  TOILET: {
    backgroundColor: "#7C3AED",
    borderColor: "#5B21B6",
    shape: "square",
    label: "Toilet",
  },
  TRANSFER_POINT: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
    shape: "circle",
    label: "Transfer",
  },
  CHARGING_POINT: {
    backgroundColor: "#059669",
    borderColor: "#047857",
    shape: "circle",
    label: "Charging",
  },
  OTHER: {
    backgroundColor: "#9CA3AF",
    borderColor: "#6B7280",
    shape: "circle",
    label: "Feature",
  },
};

export function gaisMarkerHtml(type: GaisFeatureType, selected: boolean): string {
  const style = GAIS_MARKER_STYLES[type] ?? GAIS_MARKER_STYLES.OTHER;
  const size = selected ? 18 : 14;
  const border = selected ? 3 : 2;
  const clip =
    style.shape === "triangle"
      ? "clip-path:polygon(50% 0%, 0% 100%, 100% 100%);"
      : style.shape === "diamond"
        ? "transform:rotate(45deg);"
        : style.shape === "square"
          ? "border-radius:2px;"
          : "border-radius:50%;";

  return `<span role="img" aria-hidden="true" style="display:block;width:${size}px;height:${size}px;background:${style.backgroundColor};border:${border}px solid ${style.borderColor};${clip}box-shadow:0 1px 3px rgba(0,0,0,0.25);"></span>`;
}

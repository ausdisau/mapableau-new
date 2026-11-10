import type { RagDescriptor, RagShape, RagStatus } from "./types";

const RAGU: Record<RagStatus, RagDescriptor> = {
  red: {
    status: "red",
    label: "Red",
    shape: "circle",
    shortDescription: "major barriers",
    legendDescription: "Red — route barrier, action needed",
  },
  amber: {
    status: "amber",
    label: "Amber",
    shape: "triangle",
    shortDescription: "assistance may be needed",
    legendDescription: "Amber — potential barrier, review and plan",
  },
  green: {
    status: "green",
    label: "Green",
    shape: "square",
    shortDescription: "assessed criteria met",
    legendDescription: "Green — assessed criteria met",
  },
  unknown: {
    status: "unknown",
    label: "Unknown",
    shape: "diamond",
    shortDescription: "evidence needed",
    legendDescription: "Unknown — evidence needed",
  },
};

export function getRaguDescriptor(status: RagStatus): RagDescriptor {
  return RAGU[status];
}

export function raguAnnouncement(status: RagStatus): string {
  const d = RAGU[status];
  return `${d.label}: ${d.shortDescription}`;
}

export const RAGU_LEGEND: readonly RagDescriptor[] = [
  RAGU.red,
  RAGU.amber,
  RAGU.green,
  RAGU.unknown,
];

export type { RagShape, RagStatus };

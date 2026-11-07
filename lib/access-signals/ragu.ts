export type RaguStatus = "red" | "amber" | "green" | "unknown";

export type RaguShape = "circle" | "triangle" | "square" | "diamond";

export type RaguDescriptor = {
  status: RaguStatus;
  label: string;
  shape: RaguShape;
  shortDescription: string;
  legendDescription: string;
};

const RAGU: Record<RaguStatus, RaguDescriptor> = {
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

export function getRaguDescriptor(status: RaguStatus): RaguDescriptor {
  return RAGU[status];
}

export function raguAnnouncement(status: RaguStatus): string {
  const d = RAGU[status];
  return `${d.label}: ${d.shortDescription}`;
}

export const RAGU_LEGEND: readonly RaguDescriptor[] = [
  RAGU.red,
  RAGU.amber,
  RAGU.green,
  RAGU.unknown,
];

/** Labels describe source reports, not an independent access assessment. */
export const COMMUNITY_CATEGORY_LABELS = {
  parking: "Parking",
  toilet: "Toilet",
  public_space: "Public space",
} as const;

export const COMMUNITY_WHEELCHAIR_LABELS = {
  yes: "Reported yes",
  limited: "Reported limited",
  no: "Reported no",
  designated: "Reported designated",
  unknown: "Unknown — not recorded",
} as const;

export const COMMUNITY_AREA_LABELS = {
  parramatta: "Parramatta",
  penrith: "Penrith",
  blacktown: "Blacktown",
} as const;

export function communityDateLabel(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  const isCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  if (isCalendarDate && date.toISOString().slice(0, 10) !== value) {
    return "Not recorded";
  }
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    // A source calendar date has no timezone; preserve its recorded day.
    // Retrieval/edit instants are presented in the user's Sydney timezone.
    timeZone: isCalendarDate ? "UTC" : "Australia/Sydney",
  }).format(date);
}

/** Leaflet expects HTML; provider configuration is accepted as text only. */
export function communityTileAttribution(providerAttribution?: string): string {
  const osm =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
  const extra = providerAttribution?.trim();
  if (!extra || extra === "© OpenStreetMap contributors") return osm;
  const escaped = extra.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
  return `${osm} | ${escaped}`;
}

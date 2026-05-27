import type { ParticipantNeedsSnapshot } from "@/lib/participant-needs/types";
import type { WorkerSearchFilters } from "@/lib/search/worker-search-types";

const LANGUAGE_HINTS = [
  "english",
  "arabic",
  "mandarin",
  "cantonese",
  "hindi",
  "vietnamese",
  "spanish",
] as const;

export function needsSnapshotToWorkerFilters(
  snapshot: ParticipantNeedsSnapshot,
): Partial<WorkerSearchFilters> {
  const filters: Partial<WorkerSearchFilters> = {};
  const haystack = snapshot.signals.map((s) => s.label.toLowerCase()).join(" ");

  if (snapshot.serviceRegion) {
    filters.serviceRegion = snapshot.serviceRegion;
  }

  if (
    haystack.includes("wheelchair") ||
    haystack.includes("mobility aid") ||
    snapshot.signals.some((s) => s.domain === "mobility")
  ) {
    filters.wheelchairAccessible = true;
  }

  for (const language of LANGUAGE_HINTS) {
    if (haystack.includes(language)) {
      filters.language = language;
      break;
    }
  }

  if (
    haystack.includes("personal care") ||
    haystack.includes("daily living")
  ) {
    filters.serviceType = "personal care";
  } else if (haystack.includes("transport") || haystack.includes("physio")) {
    filters.serviceType = "transport";
  } else if (haystack.includes("therapy")) {
    filters.serviceType = "therapy";
  }

  return filters;
}

export function buildWorkerSearchQueryFromSnapshot(
  snapshot: ParticipantNeedsSnapshot,
  userQuery?: string,
): string {
  const parts = [
    userQuery?.trim(),
    snapshot.displayName ? `support for ${snapshot.displayName}` : null,
    snapshot.gaps[0]?.reason,
  ].filter(Boolean);
  return parts.join(". ") || "Find support workers and providers";
}

import type {
  SuburbAccessGuide,
  SuburbAccessTheme,
  SuburbGuideStatus,
} from "@/types/suburb-access-guide";
import {
  SUBURB_GUIDE_DISCLAIMER,
  SUBURB_GUIDE_INDEXABLE_STATUSES,
} from "@/types/suburb-access-guide";

export { SUBURB_GUIDE_DISCLAIMER, SUBURB_GUIDE_INDEXABLE_STATUSES };

export function suburbGuideHref(stateSlug: string, slug: string) {
  return `/guides/suburbs/${stateSlug}/${slug}`;
}

export function suburbGuideMapHref(stateSlug: string, slug: string) {
  return `${suburbGuideHref(stateSlug, slug)}/map`;
}

export function suburbGuideReportHref(stateSlug: string, slug: string) {
  return `${suburbGuideHref(stateSlug, slug)}/report-update`;
}

export function suburbGuideStateHref(stateSlug: string) {
  return `/guides/suburbs/${stateSlug}`;
}

export function formatSuburbGuideStatus(status: SuburbGuideStatus): string {
  switch (status) {
    case "not-started":
      return "Not started";
    case "draft":
      return "Draft guide";
    case "data-enriched":
      return "Data-enriched";
    case "community-reported":
      return "Community reported";
    case "partner-supplied":
      return "Partner supplied";
    case "mapable-reviewed":
      return "MapAble reviewed";
    case "mapable-verified":
      return "MapAble verified";
    case "needs-local-verification":
      return "Needs local verification";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function formatSuburbAccessTheme(theme: SuburbAccessTheme): string {
  switch (theme) {
    case "transport":
      return "Transport";
    case "toilets":
      return "Toilets";
    case "parking-dropoff":
      return "Parking / drop-off";
    case "step-free":
      return "Step-free routes";
    case "sensory":
      return "Sensory";
    case "venues":
      return "Accessible venues";
    case "health-support":
      return "Health & support";
    case "hazards":
      return "Hazards";
    default: {
      const _exhaustive: never = theme;
      return _exhaustive;
    }
  }
}

/** Thin or unfinished guides should not be indexed by default. */
export function isSuburbGuideIndexable(guide: SuburbAccessGuide): boolean {
  if (!SUBURB_GUIDE_INDEXABLE_STATUSES.includes(guide.guideStatus)) {
    return false;
  }
  if (guide.confidenceScore < 45) return false;
  const contentLength =
    guide.accessSummary.length +
    guide.transportNotes.join(" ").length +
    guide.toiletNotes.join(" ").length +
    guide.stepFreeRouteNotes.join(" ").length +
    guide.sensoryNotes.join(" ").length +
    guide.localRisks.join(" ").length;
  return contentLength >= 180;
}

export type SuburbGuideFilterInput = {
  query?: string;
  stateSlug?: string | null;
  status?: SuburbGuideStatus | null;
  theme?: SuburbAccessTheme | null;
};

export function filterSuburbGuideList(
  guides: SuburbAccessGuide[],
  input: SuburbGuideFilterInput = {},
): SuburbAccessGuide[] {
  const query = input.query?.trim().toLowerCase() ?? "";
  return guides.filter((guide) => {
    if (input.stateSlug && guide.stateSlug !== input.stateSlug) return false;
    if (input.status && guide.guideStatus !== input.status) return false;
    if (input.theme && !guide.accessThemes.includes(input.theme)) return false;
    if (!query) return true;
    const haystack = [
      guide.name,
      guide.state,
      guide.salCode,
      guide.accessSummary,
      ...guide.lgaNames,
      ...guide.accessThemes,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function stateLabelFromSlug(stateSlug: string): string {
  const labels: Record<string, string> = {
    act: "ACT",
    nsw: "NSW",
    vic: "VIC",
    qld: "QLD",
    sa: "SA",
    wa: "WA",
    tas: "TAS",
    nt: "NT",
  };
  return labels[stateSlug] ?? stateSlug.toUpperCase();
}

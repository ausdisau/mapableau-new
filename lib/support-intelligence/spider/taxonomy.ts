import { isAffirmativeServiceLabel } from "@/lib/provider/finder/evidence";

/**
 * Maps free-text / registration-group labels onto MapAble service category slugs.
 * Unknown and negative labels remain non-matches — never invent competency claims.
 */

const KEYWORD_TO_SLUG: Array<{ slug: string; patterns: RegExp[] }> = [
  {
    slug: "daily-personal-activities",
    patterns: [/daily personal/i, /personal activit/i, /self[- ]?care/i],
  },
  {
    slug: "community-participation",
    patterns: [/community participation/i, /social.*community/i],
  },
  {
    slug: "support-coordination",
    patterns: [/support coordination/i, /coordination of supports/i],
  },
  {
    slug: "assistance-daily-life",
    patterns: [/assistance with daily life/i, /daily life/i],
  },
  {
    slug: "transport",
    patterns: [/\btransport\b/i, /travel assistance/i],
  },
  {
    slug: "allied-health",
    patterns: [/allied health/i, /physiotherap/i, /occupational therap/i, /\bspeech\b/i],
  },
];

export type TaxonomyMapping = {
  input: string;
  slug: string | null;
  state: "mapped" | "unknown" | "negative";
};

export function mapServiceLabelToTaxonomy(label: string): TaxonomyMapping {
  const trimmed = label.trim();
  if (!trimmed) {
    return { input: label, slug: null, state: "unknown" };
  }
  // "No transport" must never map to the transport slug.
  if (!isAffirmativeServiceLabel(trimmed)) {
    return { input: trimmed, slug: null, state: "negative" };
  }
  for (const entry of KEYWORD_TO_SLUG) {
    if (entry.patterns.some((re) => re.test(trimmed))) {
      return { input: trimmed, slug: entry.slug, state: "mapped" };
    }
  }
  return { input: trimmed, slug: null, state: "unknown" };
}

export function mapServicesToTaxonomy(services: string[]): {
  mapped: TaxonomyMapping[];
  unknown: string[];
  negative: string[];
} {
  const mapped = services.map(mapServiceLabelToTaxonomy);
  return {
    mapped,
    unknown: mapped.filter((m) => m.state === "unknown").map((m) => m.input),
    negative: mapped.filter((m) => m.state === "negative").map((m) => m.input),
  };
}

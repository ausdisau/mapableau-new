export const COVERAGE_CARE_ABN = "54 655 649 308" as const;

export const COVERAGE_CARE_BRAND = {
  name: "Coverage Care",
  slug: "coveragecare",
  legacySlug: "coverage-care",
  tagline: "Your life. Your choices. Our commitment.",
  mission:
    "Respect dignity, autonomy, individuality, personhood and strengths — work with people, not over them.",
  abn: COVERAGE_CARE_ABN,
  colors: {
    sage: "#849F63",
    olive: "#4B630C",
    offWhite: "#F7F8F3",
    ink: "#243528",
    turquoise: "#366F66",
  },
  values: [
    "Hope",
    "Transparency",
    "Bond/Connection",
    "Courage",
    "Collaboration",
    "Compassion",
    "Inclusivity",
  ] as const,
  syntheticBanner: "SYNTHETIC DEMO — NOT LIVE",
  poweredBy: "Powered by MapAble",
} as const;

export const COVERAGE_CARE_WAVE_PATH =
  "M2 22 C18 6, 36 6, 52 22 S86 38, 102 22 S134 6, 150 22";

export const COVERAGE_CARE_CSS_VARS = {
  "--cc-sage": COVERAGE_CARE_BRAND.colors.sage,
  "--cc-olive": COVERAGE_CARE_BRAND.colors.olive,
  "--cc-cream": COVERAGE_CARE_BRAND.colors.offWhite,
  "--cc-ink": COVERAGE_CARE_BRAND.colors.ink,
  "--cc-wave": COVERAGE_CARE_BRAND.colors.turquoise,
} as const;

/** Proposed allied-health disciplines — never claim verified availability. */
export const COVERAGE_CARE_PROPOSED_DISCIPLINES = [
  "Physiotherapy",
  "Occupational Therapy",
  "Speech Pathology",
  "Exercise Physiology",
  "Dietetics",
  "Podiatry",
  "Psychology",
  "Remedial Therapy",
  "Diabetes Care",
  "Fitness Consultation",
] as const;

export type CoverageCareProposedDiscipline =
  (typeof COVERAGE_CARE_PROPOSED_DISCIPLINES)[number];

export const LISTING_PUBLICATION_STATUS = "proposed / awaiting verification" as const;

import type { CoverageCareBrandKit } from "@/lib/coverage-care/types";

export const COVERAGE_CARE_BRAND: CoverageCareBrandKit = {
  name: "Coverage Care",
  tagline: "Your life. Your choices. Our commitment.",
  sage: "#849F63",
  olive: "#4B630C",
  values: [
    "Hope",
    "Transparency",
    "Bond/Connection",
    "Courage",
    "Collaboration",
    "Compassion and Inclusivity",
  ],
} as const;

export const COVERAGE_CARE_CSS_VARS = {
  "--cc-sage": COVERAGE_CARE_BRAND.sage,
  "--cc-olive": COVERAGE_CARE_BRAND.olive,
  "--cc-cream": "#F4F7EF",
  "--cc-ink": "#1C2410",
  "--cc-wave": "#6F8B4F",
} as const;

/** Organic wave wordmark path data for inline SVG. */
export const COVERAGE_CARE_WAVE_PATH =
  "M2 22 C18 6, 36 6, 52 22 S86 38, 102 22 S134 6, 150 22";

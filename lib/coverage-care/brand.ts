import type { CoverageCareBrandKit } from "@/lib/coverage-care/types";
import {
  COVERAGE_CARE_BRAND as TENANCY_BRAND,
  COVERAGE_CARE_CSS_VARS as TENANCY_CSS,
  COVERAGE_CARE_WAVE_PATH,
} from "@/lib/tenancy/coverage-care-brand";

export const COVERAGE_CARE_BRAND: CoverageCareBrandKit = {
  name: TENANCY_BRAND.name,
  tagline: TENANCY_BRAND.tagline,
  sage: TENANCY_BRAND.colors.sage,
  olive: TENANCY_BRAND.colors.olive,
  values: TENANCY_BRAND.values,
};

export const COVERAGE_CARE_CSS_VARS = TENANCY_CSS;
export { COVERAGE_CARE_WAVE_PATH };
export {
  COVERAGE_CARE_ABN,
  COVERAGE_CARE_PROPOSED_DISCIPLINES,
  LISTING_PUBLICATION_STATUS,
} from "@/lib/tenancy/coverage-care-brand";

/**
 * Marketing token surface. Color primitives stay on @mapable/ui for app/dashboard
 * compatibility; interactive chrome (CTAs, focus rings, page bg) uses the
 * marketing-only logo palette.
 */
export { mapableColors as mapableCareColors } from "@mapable/ui/tokens";

export {
  marketingFocusRingClass as mapableInteractiveFocusRing,
  marketingFocusRingClass as mapableCareFocusRing,
  marketingFocusRingClass as mapableCareFocusRingSubtle,
  marketingPageBgClass as mapableCarePageBgClass,
  marketingPrimaryCtaClass as mapableCareCtaClass,
  marketingOutlineCtaClass as mapableCareOutlineCtaClass,
  marketingEyebrowClass as mapableCareEyebrowClass,
} from "@/lib/marketing/brand-palette";

export const mapableCareBodyClass = "mapable-soft text-[#0C1833]";

export const mapableCareCardClass =
  "rounded-2xl border border-slate-200 bg-[#F7F8FC]";
